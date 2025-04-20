// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

// Takes a stream, and read decoded text by line on demand

"use strict";

import TextEncoding from "../textEncoding/index.mjs";

const commitData = (controller, data) => {
	controller.unsent = false;
	controller.enqueue(data);
};
const readUInt = (u8Buf, offset, size = 1, isBigEndian = true) => {
	if (typeof size !== "number" || size <= 0 || size > 4) {
		throw(new RangeError(`Invalid byte size ${size}.`));
	};
	if (!(u8Buf instanceof Uint8Array || u8Buf instanceof Uint8ClampedArray)) {
		throw(new TypeError("Input buffer is not Uint8Array."));
	};
	if (typeof offset !== "number" || offset < 0 || offset >= u8Buf.length) {
		throw(new RangeError(`Provided offset ${offset} is out of buffer range.`));
	};
	if (size === 1) {
		return u8Buf[offset];
	} else {
		let unit = 0;
		if (isBigEndian) {
			for (let i = 0; i < size; i ++) {
				unit <<= 8;
				unit |= u8Buf[offset + i];
			};
		} else {
			for (let i = 0; i < size; i ++) {
				unit |= u8Buf[offset + i] << (i << 3);
			};
		};
		if (unit < 0) {
			return unit + 4294967296;
		} else {
			return unit;
		};
	};
};

let TextReader = class {
	static lineRaw(stream, splitMode = 0) {
		if (typeof splitMode !== "number" ||
			splitMode < 0 || splitMode > 7) {
			throw(new TypeError("Invalid split mode."));
		};
		if (!stream || stream?.constructor !== ReadableStream) {
			throw(new TypeError("Not a readable stream."));
		};
		let unitLength = TextEncoding.getUnitSize(splitMode);
		let isBigEndian = TextEncoding.isBigEndian(splitMode);
		let reader = stream.getReader();
		let chunk, finished = false;
		let bufferBuilder = [], ptr = 0, lastPtr = 0, lastUnit = 0;
		return new ReadableStream({
			"pull": async (controller) => {
				controller.unsent = true;
				while (controller.unsent) {
					if (!chunk || ptr >= chunk.length) {
						// Commit unfinished buffer
						if (ptr > lastPtr) {
							bufferBuilder.push(chunk.subarray(lastPtr));
							lastPtr = 0;
							//console.debug(`Read a new chunk.`);
						};
						// Read a new chunk
						let readResult = await reader.read();
						chunk = readResult.value;
						finished = readResult.done;
						// Reset pointer
						ptr = 0;
					};
					if (chunk) {
						// Continue the read operation
						////console.debug(`Read byte at chunk pointer ${ptr}.`);
						let e = 0;
						if (unitLength === 1) {
							e = chunk[ptr];
						} else {
							if (isBigEndian) {
								for (let i = 0; i < unitLength; i ++) {
									e <<= 8;
									e |= chunk[ptr + i];
								};
							} else {
								for (let i = 0; i < unitLength; i ++) {
									e |= chunk[ptr + i] << (i << 3);
								};
							};
						};
						let commitNow = false;
						switch (e) {
							case 10: {
								if (lastUnit === 13) {
									lastPtr += unitLength;
								} else {
									commitNow = true;
								};
								break;
							};
							case 13: {
								commitNow = true;
								break;
							};
						};
						if (commitNow) {
							if (bufferBuilder.length) {
								//console.debug(`Building a multi-part buffer. ${ptr}`);
								// Add buffer
								bufferBuilder.push(chunk.subarray(lastPtr, ptr));
								// Calculate buffer size
								let mergeLen = 0;
								for (let i = 0; i < bufferBuilder.length; i ++) {
									mergeLen += bufferBuilder[i].length;
								};
								// Merge buffer
								let mergedBuffer = new Uint8Array(mergeLen);
								let mergedPtr = 0;
								for (let i = 0; i < bufferBuilder.length; i ++) {
									mergedBuffer.set(bufferBuilder[i], mergedPtr);
									mergedPtr += bufferBuilder[i].length;
								};
								// Commit buffer
								commitData(controller, mergedBuffer);
								// Clear buffer
								bufferBuilder = [];
								//console.debug(`Multi-part buffer write finished. ${ptr}`);
							} else {
								// Just commit the current segment
								commitData(controller, chunk.subarray(lastPtr, ptr));
								//console.debug(`Single buffer write finished. ${ptr}`);
							};
							lastPtr = ptr += unitLength;
						};
						lastUnit = e;
					} else {
						//console.debug(`No reading available. ${ptr}`);
					};
					if (finished) {
						//console.debug(`Stream finished.`);
						// Detect remaining buffer
						if (lastPtr !== ptr && chunk) {
							bufferBuilder.push(chunk.subarray(lastPtr, ptr));
						};
						// Commit all remaining buffer
						if (bufferBuilder.length) {
							//console.debug(`Building a multi-part buffer.`);
							// Calculate buffer size
							let mergeLen = 0;
							for (let i = 0; i < bufferBuilder.length; i ++) {
								mergeLen += bufferBuilder[i].length;
							};
							// Merge buffer
							let mergedBuffer = new Uint8Array(mergeLen);
							let mergedPtr = 0;
							for (let i = 0; i < bufferBuilder.length; i ++) {
								mergedBuffer.set(bufferBuilder[i], mergedPtr);
								mergedPtr += bufferBuilder[i].length;
							};
							// Commit buffer
							commitData(controller, mergedBuffer);
							//console.debug(`Multi-part buffer write finished.`);
						}
						// Close the stream
						controller.unsent = false;
						controller.close();
					};
					ptr += unitLength;
				};
			}
		}, new ByteLengthQueuingStrategy({"highWaterMark": 256}));
	};
	static chunkRaw(stream, collapsed = "utf-8") {
		if (!stream || stream?.constructor !== ReadableStream) {
			throw(new TypeError("Not a readable stream."));
		};
		let splitMode = TextEncoding.indicator(collapsed);
		let unitLength = TextEncoding.getUnitSize(splitMode);
		let isBigEndian = TextEncoding.isBigEndian(splitMode);
		let reader = stream.getReader();
		let remainderBuffer;
		return new ReadableStream({
			"pull": async (controller) => {
				controller.unsent = true;
				let {value, done} = await reader.read();
				if (value) {
					let startPtr = 0, endPtr = value.length;
					// Remainder reconstruction phase
					if (splitMode !== 0 && typeof remainderBuffer?.length === "number") {
						// This operates on the basis of assuming that each chunk is at least four bytes. If not, this can break horribly.
						// While rewriting this section to handle such scenarios more gracefully is possible, for now the spaghetti code has to suffice.
						let firstEndIsFound = false;
						switch (collapsed) {
							case "big5":
							case "gbk":
							case "sjis":
							case "euc-kr": {
								// At most two bytes, so the buffer will be at most 1 byte
								startPtr = 1;
								let transientBuffer = new Uint8Array(2);
								transientBuffer[0] = remainderBuffer[0];
								transientBuffer[1] = value[0];
								commitData(controller, transientBuffer);
								break;
							};
							case "euc-jp": {
								// At most three bytes.
								let transientSize = 3;
								if (remainderBuffer[0] === 0x8F) {
									// Three bytes
									startPtr = 3 - remainderBuffer.length;
								} else if (remainderBuffer[0] > 0x7F) {
									// Two bytes
									startPtr = 1;
									transientSize = 2;
								} else {
									// Just emit that buffer
									transientSize = remainderBuffer.length;
								};
								let transientBuffer = new Uint8Array(3);
								transientBuffer.set(remainderBuffer);
								transientBuffer.set(value.subarray(0, startPtr), remainderBuffer.length);
								commitData(controller, transientBuffer.subarray(0, transientSize));
								break;
							};
							case "gb18030": {
								// At most four bytes.
								let transientBuffer = new Uint8Array(4),
								transientSize = 4;
								transientBuffer.set(remainderBuffer);
								transientBuffer.set(value.subarray(0, 4 - remainderBuffer.length), remainderBuffer.length);
								if (transientBuffer[0] < 0x80) {
									// Just emit that buffer
									transientSize = remainderBuffer.length;
								} else if (transientBuffer[1] >= 0x40) {
									// Two bytes
									startPtr = 1;
									transientSize = 2;
								} else {
									// Four bytes
									startPtr = 4 - remainderBuffer.length;
								};
								commitData(controller, transientBuffer.subarray(0, transientSize));
								break;
							};
							case "utf-8": {
								// At most four bytes
								let transientSize = 4;
								if (remainderBuffer[0] >= 0b11110000) {
									// Four bytes
									startPtr = 4 - remainderBuffer.length;
								} else if (remainderBuffer[0] >= 0b11100000) {
									// Three bytes
									startPtr = 3 - remainderBuffer.length;
									transientSize = 3;
								} else if (remainderBuffer[0] >= 0b11000000) {
									// Two bytes
									startPtr = 1;
									transientSize = 2;
								} else {
									// Just emit the buffer
									transientSize = remainderBuffer.length;
								};
								let transientBuffer = new Uint8Array(4);
								transientBuffer.set(remainderBuffer);
								transientBuffer.set(value.subarray(0, startPtr), remainderBuffer.length);
								commitData(controller, transientBuffer.subarray(0, transientSize));
								break;
							};
							case "utf-16":
							case "utf-16be": {
								// At most four bytes, in two-byte units
								let transientBuffer = new Uint8Array(4);
								transientBuffer.set(remainderBuffer);
								transientBuffer.set(value.subarray(0, 4 - remainderBuffer.length));
								startPtr = 4 - remainderBuffer.length;
								if (readUInt(transientSize, 0, 2, isBigEndian) >= 0xD800 && readUInt(transientSize, 2, 2, isBigEndian) >= 0xD800) {
									// Both are surrogate pairs
									commitData(controller, transientBuffer);
								} else {
									// Lone byte pairs
									commitData(controller, transientBuffer.subarray(0, 2));
									commitData(controller, transientBuffer.subarray(2));
								};
								break;
							};
							default: {
								// Fixed length unit encodings, like UTF-24 and UTF-32
								let transientBuffer = new Uint8Array(unitLength);
								transientBuffer.set(remainderBuffer);
								transientBuffer.set(value.subarray(0, unitLength - remainderBuffer.length), remainderBuffer.length);
								commitData(controller, transientBuffer);
							};
						};
					};
					remainderBuffer = undefined;
					// Code point tracking phase
					if (splitMode === 0) {
						// No need to do anything
						commitData(controller, value.subarray(startPtr));
					} else {
						switch (collapsed) {
							case "utf-24":
							case "utf-24be":
							case "utf-32":
							case "utf-32be": {
								// Deterministic, never vary
								let validUnits = Math.floor((value.length - startPtr) / unitLength);
								endPtr = validUnits * unitLength;
								break;
							};
							case "utf-8": {
								// Allows very fast backtracking
								if (value[value.length - 1] > 0x7F) {
									// Valid non-ASCII code points never touches the ASCII range
									let findUnitStart = true,
									ptr = value.length, ptrMin = value.length - 8;
									while (findUnitStart && ptr > ptrMin) {
										ptr --;
										if (value[ptr] < 0x80) {
											endPtr = ptr + 1;
										} else if (value[ptr] > 0b11000000) {
											endPtr = ptr;
										};
									};
								};
								break;
							};
							case "utf-16":
							case "utf-16be": {
								// Some tricks to accelerate is possible
								//
								break;
							};
							default: {
								// Not all encodings distinguish between high and low bytes
								for (let i = startPtr; i < value.length; i ++) {
									//
								};
							};
						};
						commitData(controller, value.subarray(startPtr, endPtr));
					};
					// Remainder commit phase
					if (endPtr < value.length) {
						remainderBuffer = value.subarray(endPtr);
					};
				};
				if (done) {
					if (typeof remainderBuffer?.length === "number") {
						commitData(controller, remainderBuffer);
					};
					controller.unsent = false;
					controller.close();
				};
			}
		}, new ByteLengthQueuingStrategy({"highWaterMark": 256}));
	};
	static line(stream, label = "utf-8") {
		let collapsed = TextEncoding.collapse(label);
		let bei = TextEncoding.indicator(collapsed);
		let rawStream = this.lineRaw(stream, bei).getReader();
		let decoder = new TextDecoder(collapsed);
		return new ReadableStream({
			"pull": async (controller) => {
				let {value, done} = await rawStream.read();
				if (value) {
					controller.enqueue(decoder.decode(value));
				};
				if (done) {
					controller.close();
				};
			}
		});
	};
	static chunk(stream, label = "utf-8") {
		let collapsed = TextEncoding.collapse(label);
		let rawStream = this.chunkRaw(stream, collapsed).getReader();
		let decoder = new TextDecoder(collapsed);
		return new ReadableStream({
			"pull": async (controller) => {
				let {value, done} = await rawStream.read();
				if (value) {
					console.debug(value);
					controller.enqueue(decoder.decode(value));
				};
				if (done) {
					controller.close();
				};
			}
		});
	};
};

export default TextReader;
