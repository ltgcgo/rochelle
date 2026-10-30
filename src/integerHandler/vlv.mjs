// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.
// Originally from Seamstress.

"use strict";

import BaseIntegerHandler from "./base.mjs";

const VLVReader = class VLVReader extends BaseIntegerHandler {
	static MASK_VLV = 128;
	// Standard MIDI VLV-8, slightly extended.
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static size(buffer, offset = 0) {
		this.assertU8(buffer);
		if (
			!Number.isSafeInteger(offset) ||
			offset < 0 ||
			offset >= buffer.length
		) return 0;
		let breakCrit = Math.min(buffer.length - offset, 16) + offset;
		for (let i = offset; i < breakCrit; i ++) {
			let e = buffer[i];
			if ((e & this.MASK_VLV) === 0) {
				return i - offset + 1;
			};
		};
		return 0; // Failure.
	};
	/** @param {number} value */
	static length(value) {
		this.assertNumber(value);
		if (value < 0 || value > 268435455) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^28.`));
		};
		return value === 0 ? 1 : Math.floor((38 - Math.clz32(value)) / 7);
	};
	/** @param {bigint} value */
	static lengthBigInt(value) {
		this.assertBigInt(value);
		if (value < 0n || value > 0xffffffffffffffffffffffffffffn) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^112.`));
		};
		return value === 0n ? 1 : Math.floor((this.bitsBigUint(value) + 6) / 7);
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static read(buffer, offset = 0) {
		// VLV-8 are all big-endian.
		this.assertU8(buffer);
		let breakCrit = Math.min(buffer.length - offset, 4),
		breakTest = breakCrit - 1,
		result = 0;
		let nonCanonicalHead = true;
		for (let i = 0; i < breakCrit; i ++) {
			let e = buffer[i + offset];
			if (i > 0) {
				result <<= 7;
			};
			result |= e & 127;
			if (e === 128) {
				if (nonCanonicalHead) {
					const errorMsg = `Encountered a non-canonical VLV-8 byte 0x80.`;
					if (this.useStrict) {
						throw(new Error(errorMsg));
					} else {
						console.warn(errorMsg);
					};
				};
			} else {
				nonCanonicalHead = false;
			};
			if ((e & this.MASK_VLV) === 0) {
				break;
			} else if (i >= breakTest) {
				throw(new Error(`VLV-8 did not terminate at the end of the read buffer.`));
			};
		};
		return result;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readBigInt(buffer, offset = 0) {
		// VLV-8 are all big-endian.
		this.assertU8(buffer);
		let breakCrit = Math.min(buffer.length - offset, 16),
		breakTest = breakCrit - 1,
		result = 0n;
		let nonCanonicalHead = true;
		for (let i = 0; i < breakCrit; i ++) {
			let e = buffer[i + offset];
			if (i > 0) {
				result <<= 7n;
			};
			result |= BigInt(e & 127);
			if (e === 128) {
				if (nonCanonicalHead) {
					const errorMsg = `Encountered a non-canonical VLV-8 byte 0x80.`;
					if (this.useStrict) {
						throw(new Error(errorMsg));
					} else {
						console.warn(errorMsg);
					};
				};
			} else {
				nonCanonicalHead = false;
			};
			if ((e & this.MASK_VLV) === 0) {
				break;
			} else if (i >= breakTest) {
				throw(new Error(`VLV-8 did not terminate at the end of the read buffer.`));
			};
		};
		return result;
	};
};

const VLVHandler = class VLVHandler extends VLVReader {
	static write(buffer, value, offset = 0) {
		this.assertU8(buffer);
		this.assertNumber(value);
		const vlvSize = this.length(value);
		let view = value, setBit = 0;
		for (let ptr = vlvSize - 1; ptr >= 0; ptr --) {
			buffer[offset + ptr] = setBit | (view & 127);
			setBit = 128;
			view >>= 7;
		};
	};
	static writeBigInt(buffer, value, offset = 0) {
		this.assertU8(buffer);
		this.assertBigInt(value);
		const vlvSize = this.lengthBigInt(value);
		let view = value, setBit = 0;
		for (let ptr = vlvSize - 1; ptr >= 0; ptr --) {
			buffer[offset + ptr] = setBit | Number(view & 127n);
			setBit = 128;
			view >>= 7n;
		};
	};
	static emit(value) {
		const buffer = new Uint8Array(this.length(value));
		this.write(buffer, value);
		return buffer;
	};
	static emitBigInt(value) {
		const buffer = new Uint8Array(this.lengthBigInt(value));
		this.writeBigInt(buffer, value);
		return buffer;
	};
};

export {
	VLVReader,
	VLVHandler
};