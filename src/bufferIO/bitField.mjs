// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

/** @param {number[]} sourceBuffer
* @param {Uint8Array|Uint8ClampedArray} targetBuffer
* @returns {void} */
const bitFieldPackA = (sourceBuffer, targetBuffer, options) => {
	const threshold = options?.threshold > 0 ? options.threshold : 1;
	targetBuffer.fill(0, 0, (sourceBuffer.length + 7) >> 3);
	for (let i = 0; i < sourceBuffer.length; i ++) {
		targetBuffer[i >>> 3] |= (sourceBuffer[i] >= threshold ? 1 : 0) << (i & 7);
	};
};
/** @param {number[]} sourceBuffer
* @param {Uint8Array|Uint8ClampedArray} targetBuffer
* @returns {void} */
const bitFieldPackB = (sourceBuffer, targetBuffer, options) => {
	const threshold = options?.threshold > 0 ? options.threshold : 1;
	let buffered = 0;
	for (let i = 0; i < sourceBuffer.length; i ++) {
		buffered |= (sourceBuffer[i] >= threshold ? 1 : 0) << (i & 7);
		if ((i & 7) === 7) {
			targetBuffer[i >>> 3] = buffered;
			buffered = 0;
		};
	};
	if ((sourceBuffer.length & 7) > 0) {
		targetBuffer[sourceBuffer.length >>> 3] = buffered;
	};
};

/** @param {number[]} sourceBuffer
* @param {Uint8Array|Uint8ClampedArray} targetBuffer
* @returns {Uint8Array} */
const bitFieldPack = (sourceBuffer, targetBuffer, options = {
	"strict": true,
	"threshold": 1
}) => {
	if (typeof sourceBuffer?.length !== "number") {
		throw(new SyntaxError("The source buffer must be an array-like object."));
	} else if (sourceBuffer.length >= 0x80000000) {
		throw(new RangeError("Source buffer too large."));
	};
	const desiredSize = (sourceBuffer.length >>> 3) + (sourceBuffer.length & 7 ? 1 : 0);
	switch (targetBuffer?.constructor) {
		case Uint8Array:
		case Uint8ClampedArray: {
			if (targetBuffer.length >= 0x10000000) {
				throw(new RangeError("Target buffer too large."));
			} else if (options?.strict && targetBuffer.length < desiredSize) {
				throw(new RangeError("The target buffer cannot satisfy the packed bit field."));
			};
			break;
		};
		default: {
			if (targetBuffer == null) {
				targetBuffer = new Uint8Array(desiredSize);
			} else {
				throw(new TypeError("The target buffer must be an Uint8Array."));
			};
		};
	};
	if (globalThis.Deno && sourceBuffer.length >= 395264) {
		bitFieldPackA(sourceBuffer, targetBuffer, options);
	} else {
		bitFieldPackB(sourceBuffer, targetBuffer, options);
	};
	return targetBuffer;
};
/** @param {Uint8Array|Uint8ClampedArray} sourceBuffer
* @param {number[]} targetBuffer
* @returns {Uint8Array} */
const bitFieldUnpack = (sourceBuffer, targetBuffer, options = {
	"maxSize": 0,
	"strict": true,
	"value": 1
}) => {
	switch (sourceBuffer?.constructor) {
		case Uint8Array:
		case Uint8ClampedArray: {
			if (sourceBuffer.length >= 0x10000000) {
				throw(new RangeError("Source buffer too large."));
			};
			break;
		};
		default: {
			throw(new TypeError("The source buffer must be an Uint8Array."));
		};
	};
	let desiredSize = sourceBuffer.length << 3;
	const maxSize = options?.maxSize ?? 0;
	if (maxSize > 0) {
		desiredSize = Math.min(desiredSize, maxSize);
	};
	//console.debug(sourceBuffer.length, desiredSize);
	if (targetBuffer) {
		if (typeof targetBuffer?.length !== "number") {
			throw(new SyntaxError("The target buffer must be an array-like object."));
		} else if (targetBuffer.length >= 0x80000000) {
			throw(new RangeError("Target buffer too large."));
		};
		if (options?.strict && targetBuffer.length < desiredSize) {
			throw(new Error("The target buffer cannot satisfy the packed bit field."));
		};
	} else {
		targetBuffer = new Uint8Array(desiredSize);
	};
	const value = options?.value > 0 ? options.value : 0;
	let rollingByte = 0;
	for (let i = 0; i < desiredSize; i ++) {
		if (i & 7) {
			rollingByte >>= 1;
		} else {
			rollingByte = sourceBuffer[i >>> 3];
		};
		targetBuffer[i] = (rollingByte & 1) ? value : 0;
	};
	return targetBuffer;
};

export {
	bitFieldPack,
	bitFieldUnpack
};