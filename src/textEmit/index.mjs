// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

// Takes a stream, and emit decoded text

"use strict";

const encodings = ["utf-8", "utf-16", "utf-16be"];

/*
ontext: When a line of text is available, returns the decoded string
onfail: When a line of text is available but decoding failed, returns the raw bytes
onchunk: When a chunk is received, returns the raw bytes
onraw: When a line of text is available, returns the raw bytes
onclose
*/

let TextEmitter = class extends EventTarget {
	static SPLIT_UTF_8 = 0;
	static SPLIT_UTF_16_LE = 1;
	static SPLIT_UTF_16_BE = 2;
	#stream;
	#decoder;
	constructor(stream, splitMode = 0) {
		super();
		if (splitMode?.constructor != Number ||
			splitMode < 0 ||
			splitMode >= encodings.length) {
			throw(new TypeError("Invalid split mode"));
		};
		if (splitMode) {
			throw(new Error("UTF-16LE/BE currently not implemented"));
		};
		if (!stream || stream?.constructor != ReadableStream) {
			throw(new TypeError("Not a readable stream"));
		};
		this.#stream = stream;
		let reader = stream.getReader();
		this.#decoder = new TextDecoder(encodings[splitMode], {fatal: true});
		let streamAlive = true, notClosed = true;
		let buffer;
		(async () => {
			reader.closed.then(() => {
				if (buffer) {
					this.dispatchEvent(new MessageEvent("raw", {
						"data": buffer
					}));
					buffer = undefined;
				};
				this.dispatchEvent(new Event("close"));
				notClosed = false;
			}).catch((err) => {
				if (buffer) {
					this.dispatchEvent(new MessageEvent("raw", {
						"data": buffer
					}));
					buffer = undefined;
				};
				this.dispatchEvent(new ErrorEvent("error", {
					message: err.message,
					error: err
				}));
				this.dispatchEvent(new Event("close"));
				notClosed = false;
			});
			while (streamAlive && notClosed) {
				try {
					let chunk = await reader.read();
					streamAlive = !chunk.done;
					if (streamAlive) {
						let byteArray = chunk.value;
						this.dispatchEvent(new MessageEvent("chunk", {
							"data": byteArray
						}));
						if (byteArray.constructor != Uint8Array &&
							byteArray.constructor != Uint8ClampedArray) {
							this.dispatchEvent(new MessageEvent("fail", {
								"data": byteArray
							}));
						} else {
							// Splitter!
							let startIdx = 0;
							let endIdx = 0;
							let lastChar = 0;
							let isBroken = false;
							for (let i = 0; i < byteArray.length; i ++) {
								switch (byteArray[i]) {
									case 10: {
										if (lastChar == 13) {
											startIdx ++;
										} else {
											isBroken = true;
											endIdx = i;
										};
										break;
									};
									case 13: {
										isBroken = true;
										endIdx = i;
										break;
									};
									default: {
										isBroken = false;
									};
								};
								if (isBroken) {
									let sliceBuffer = byteArray.subarray(startIdx, endIdx);
									let commitBuffer = sliceBuffer;
									if (buffer) {
										commitBuffer = new Uint8Array(buffer.length + sliceBuffer.length);
										commitBuffer.set(buffer);
										commitBuffer.set(sliceBuffer, buffer.length);
										buffer = undefined;
									};
									this.dispatchEvent(new MessageEvent("raw", {
										"data": commitBuffer
									}));
									try {
										let text = this.#decoder.decode(commitBuffer);
										this.dispatchEvent(new MessageEvent("text", {
											"data": text
										}));
									} catch (err) {
										this.dispatchEvent(new MessageEvent("fail", {
											"data": commitBuffer
										}));
									};
									startIdx = i + 1;
									isBroken = false;
								};
								lastChar = byteArray[i];
							};
							if (!isBroken) {
								// Commit unfinished text to buffer
								if (buffer) {
									let sliceBuffer = byteArray.subarray(startIdx);
									let commitBuffer = new Uint8Array(buffer.length + sliceBuffer.length);
									commitBuffer.set(buffer);
									commitBuffer.set(sliceBuffer, buffer.length);
									buffer = commitBuffer;
								} else if (startIdx < byteArray.length) {
									buffer = byteArray.subarray(startIdx);
								};
							};
						};
					} else {
						if (buffer) {
							// Empty the buffer
							this.dispatchEvent(new MessageEvent("raw", {
								"data": buffer
							}));
							buffer = undefined;
						};
						this.dispatchEvent(new Event("close"));
					};
				} catch (err) {
					if (buffer) {
						// Empty the buffer
						this.dispatchEvent(new MessageEvent("raw", {
							"data": buffer
						}));
						buffer = undefined;
					};
					this.dispatchEvent(new ErrorEvent("error", {
						message: err.message,
						error: err
					}));
					this.dispatchEvent(new Event("close"));
				};
			};
		})();
	};
};

export default TextEmitter;
