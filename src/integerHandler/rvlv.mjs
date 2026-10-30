// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.
// Originally from Seamstress.

"use strict";

import BaseIntegerHandler from "./base.mjs";

const RVLVReader = class RVLVReader extends BaseIntegerHandler {
	static MASK_RVLV = 192;
	static RVLV_START = 192;
	static RVLV_MIDDLE = 128;
	static RVLV_END = 64;
	static RVLV_SINGLE = 0;
	// Reversible VLV-8, built on top of the MIDI VLV-8 idea. Accidentally recreated the packet continuation state in MIDI 2.0.
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static size(buffer, offset = 0) {
		this.assertU8(buffer);
		switch (buffer[offset] & this.MASK_RVLV) {
			case this.RVLV_SINGLE: {
				return 1;
				break;
			};
			case this.RVLV_MIDDLE:
			case this.RVLV_END: {
				//console.debug(`Invalid start state. (${offset} + 0)`);
				return 0;
				break;
			};
		};
		// The only valid state for the first offset byte in the buffer at this point is RVLV_START.
		let storedState = 3, // 1-3: END, MIDDLE, START
		breakCrit = Math.min(buffer.length, 16);
		for (let i = 1; i < breakCrit; i ++) {
			let e = buffer[i + offset],
			currentState = e >> 6;
			if (
				currentState === 0 ||
				(storedState === 3 && (0b00001001 >> currentState & 1)) ||
				(storedState === 2 && currentState > storedState)
			) {
				//console.debug(`Invalid transitioning state: ${storedState} → ${currentState}. (${offset} + 0)`);
				return 0;
			} else if (currentState === 1) {
				return i + 1;
			};
			storedState = currentState;
		};
		return 0; // Failure.
	};
	/** @param {number} value */
	static length(value) {
		this.assertNumber(value);
		if (value < 0 || value > 16777215) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^24.`));
		};
		return value === 0 ? 1 : Math.floor((37 - Math.clz32(value)) / 6);
	};
	/** @param {bigint} value */
	static lengthBigInt(value) {
		this.assertBigInt(value);
		if (value < 0n || value > 0xffffffffffffffffffffffffn) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^96.`));
		};
		return value === 0n ? 1 : Math.floor((this.bitsBigUint(value) + 5) / 6);
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static read(buffer, offset = 0) {
		this.assertU8(buffer);
		switch (buffer[offset] & this.MASK_RVLV) {
			case this.RVLV_SINGLE: {
				return buffer[offset] & 63;
				break;
			};
			case this.RVLV_MIDDLE:
			case this.RVLV_END: {
				throw(new Error(`Invalid RVLV start state. (${offset} + 0)`));
				break;
			};
		};
		// The only valid state for the first offset byte in the buffer at this point is RVLV_START.
		let storedState = 3, // 1-3: END, MIDDLE, START
		breakCrit = Math.min(buffer.length, 4),
		breakTest = breakCrit - 1,
		result = buffer[offset] & 63;
		for (let i = 1; i < breakCrit; i ++) {
			let e = buffer[i + offset],
			currentState = e >> 6;
			if (
				currentState === 0 ||
				(storedState === 3 && (0b00001001 >> currentState & 1)) ||
				(storedState === 2 && currentState > storedState)
			) {
				throw(new Error(`Invalid transitioning state: ${storedState} → ${currentState}. (${offset} + 0)`));
				return;
			};
			result <<= 6;
			result |= e & 63;
			if (currentState === 1) {
				break;
			} else if (i >= breakTest) {
				throw(new Error(`RVLV-8 did not terminate at the end of the read buffer.`));
			};
			storedState = currentState;
		};
		return result;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readBigInt(buffer, offset = 0) {
		this.assertU8(buffer);
		switch (buffer[offset] & this.MASK_RVLV) {
			case this.RVLV_SINGLE: {
				return BigInt(buffer[offset] & 63);
				break;
			};
			case this.RVLV_MIDDLE:
			case this.RVLV_END: {
				throw(new Error(`Invalid RVLV start state. (${offset} + 0)`));
				break;
			};
		};
		// The only valid state for the first offset byte in the buffer at this point is RVLV_START.
		let storedState = 3, // 1-3: END, MIDDLE, START
		breakCrit = Math.min(buffer.length, 4),
		breakTest = breakCrit - 1,
		result = BigInt(buffer[offset] & 63);
		for (let i = 1; i < breakCrit; i ++) {
			let e = buffer[i + offset],
			currentState = e >> 6;
			if (
				currentState === 0 ||
				(storedState === 3 && (0b00001001 >> currentState & 1)) ||
				(storedState === 2 && currentState > storedState)
			) {
				throw(new Error(`Invalid transitioning state: ${storedState} → ${currentState}. (${offset} + 0)`));
				return;
			};
			result <<= 6n;
			result |= BigInt(e & 63);
			if (currentState === 1) {
				break;
			} else if (i >= breakTest) {
				throw(new Error(`RVLV-8 did not terminate at the end of the read buffer.`));
			};
			storedState = currentState;
		};
		return result;
	};
};

export {
	RVLVReader
};