// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

// Takes a stream, and read decoded text by line on demand

"use strict";

import TextEncoding from "../textEncoding/index.mjs";

let commitData = (controller, data) => {
	controller.unsent = false;
	controller.enqueue(data);
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
		let sink = new ReadableStream({
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
						let {value, done} = await reader.read();
						chunk = value;
						finished = done;
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
		return sink;
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
};

export default TextReader;
