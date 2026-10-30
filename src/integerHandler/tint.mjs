// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import BaseIntegerHandler from "./base.mjs";
import NativeHandler from "./native.mjs";

const errorMsgNC = `Encountered a non-canonical tagged integer.`;

const TIntReader = class TIntReader extends BaseIntegerHandler {
	// Tagged integers. Signed variants are extensions.
	// Currently only seen in Open ModPlug Tracker and called "adaptive integer", which is just a misnomer.
	// Besides the potential speed advantage, why didn't they just use VLV-8?
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static sizeTInt16(buffer, offset = 0) {
		if (!Number.isSafeInteger(offset) || offset < 0) {
			throw(new RangeError(`Offset must be a non-negative integer within bounds.`));
		};
		this.assertU8(buffer);
		const expectedSize = (buffer[offset] & 1) + 1;
		return (buffer.length - offset) >= expectedSize ? expectedSize: 0;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTUint16(buffer, offset = 0) {
		this.assertU8(buffer);
		let result;
		switch (this.sizeTInt16(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 16-bit integer.`));
				break;
			};
			case 1: {
				result = buffer[offset];
				break;
			};
			case 2: {
				result = NativeHandler.readUint16(buffer, true, offset);
				if (result <= 0xff) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 16-bit integer read state.`));
			};
		};
		return result >>> 1;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTInt16(buffer, offset = 0) {
		this.assertU8(buffer);
		let result;
		switch (this.sizeTInt16(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 16-bit integer.`));
				break;
			};
			case 1: {
				result = NativeHandler.readInt8(buffer, offset);
				break;
			};
			case 2: {
				result = NativeHandler.readInt16(buffer, true, offset);
				if (result <= 0x7f && result >= -0x80) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 16-bit integer read state.`));
			};
		};
		return result >> 1;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static sizeTInt32(buffer, offset = 0) {
		if (!Number.isSafeInteger(offset) || offset < 0) {
			throw(new RangeError(`Offset must be a non-negative integer within bounds.`));
		};
		this.assertU8(buffer);
		const expectedSize = (buffer[offset] & 3) + 1;
		return (buffer.length - offset) >= expectedSize ? expectedSize: 0;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTUint32(buffer, offset = 0) {
		this.assertU8(buffer);
		let result;
		switch (this.sizeTInt32(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 32-bit integer.`));
				break;
			};
			case 1: {
				result = buffer[offset];
				break;
			};
			case 2: {
				result = NativeHandler.readUint16(buffer, true, offset);
				if (result <= 0xff) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 3: {
				result = NativeHandler.readUint24(buffer, true, offset);
				if (result <= 0xffff) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 4: {
				result = NativeHandler.readUint32(buffer, true, offset);
				if (result <= 0xffffff) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 32-bit integer read state.`));
			};
		};
		return result >>> 2;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTInt32(buffer, offset = 0) {
		this.assertU8(buffer);
		let result;
		switch (this.sizeTInt32(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 32-bit integer.`));
				break;
			};
			case 1: {
				result = NativeHandler.readInt8(buffer, offset);
				break;
			};
			case 2: {
				result = NativeHandler.readInt16(buffer, true, offset);
				if (result <= 0x7f && result >= -0x80) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 3: {
				result = NativeHandler.readInt24(buffer, true, offset);
				if (result <= 0x7fff && result >= -0x8000) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 4: {
				result = NativeHandler.readInt32(buffer, true, offset);
				if (result <= 0x7fffff && result >= -0x800000) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 32-bit integer read state.`));
			};
		};
		return result >> 2;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static sizeTInt64(buffer, offset = 0) {
		if (!Number.isSafeInteger(offset) || offset < 0) {
			throw(new RangeError(`Offset must be a non-negative integer within bounds.`));
		};
		this.assertU8(buffer);
		const expectedSize = 1 << (buffer[offset] & 3);
		return (buffer.length - offset) >= expectedSize ? expectedSize: 0;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTUint64(buffer, offset = 0) {
		this.assertU8(buffer);
		switch (this.sizeTInt64(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 64-bit integer.`));
				break;
			};
			case 1: {
				return buffer[offset] >>> 2;
				break;
			};
			case 2: {
				const result = NativeHandler.readUint16(buffer, true, offset) >>> 2;
				if (result <= 0x3f) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				return result;
				break;
			};
			case 4: {
				const result = NativeHandler.readUint32(buffer, true, offset) >>> 2;
				if (result <= 0x3fff) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				return result;
				break;
			};
			case 8: {
				// Must not reach 2⁴⁶!
				if (NativeHandler.readUint16(buffer, true, offset + 6) > 0) {
					throw(new RangeError(`Invalid tagged 64-bit integer read state.`));
				} else {
					const high16Bit = NativeHandler.readUint16(buffer, true, offset + 4);
					if (high16Bit <= 0x3fffffff) {
						if (this.useStrict) {
							throw(new TypeError(errorMsgNC));
						} else {
							console.warn(errorMsgNC);
						};
					};
					const low30Bit = NativeHandler.readUint32(buffer, true, offset) >>> 2;
					return high16Bit * 0x40000000 + low30Bit;
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 64-bit integer read state.`));
			};
		};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTInt64(buffer, offset = 0) {
		this.assertU8(buffer);
		switch (this.sizeTInt64(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 64-bit integer.`));
				break;
			};
			case 1: {
				return NativeHandler.readInt8(buffer, offset) >> 2;
				break;
			};
			case 2: {
				const result = NativeHandler.readInt16(buffer, true, offset) >> 2;
				if (result <= 0x3f && result >= -0x40) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				return result;
				break;
			};
			case 4: {
				const result = NativeHandler.readInt32(buffer, true, offset) >> 2;
				if (result <= 0x3fff && result >= -0x4000) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				return result;
				break;
			};
			case 8: {
				// This actually allows [-2⁴⁶, 2⁴⁶), as the highest 16-bits handled the sign bit.
				switch (NativeHandler.readUint16(buffer, true, offset + 6)) {
					case 0x0000: {
						const high16Bit = NativeHandler.readUint16(buffer, true, offset + 4);
						return high16Bit * 0x40000000 + (NativeHandler.readUint32(buffer, true, offset) >>> 2);
						break;
					};
					case 0xffff: {
						const high16BitFlipped = NativeHandler.readUint16(buffer, true, offset + 4);
						const low30BitFlipped = NativeHandler.readUint32(buffer, true, offset) >>> 2;
						return -((high16BitFlipped ^ 0xffff) * 0x40000000 + (low30BitFlipped ^ 0x3fffffff)) - 1; // Do you like two's complement?
						break;
					};
					default: {
						throw(new RangeError(`Invalid tagged 64-bit integer read state.`));
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 64-bit integer read state.`));
			};
		};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTBigUint64(buffer, offset = 0) {
		this.assertU8(buffer);
		let result;
		switch (this.sizeTInt64(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 64-bit integer.`));
				break;
			};
			case 1: {
				result = BigInt(buffer[offset]);
				break;
			};
			case 2: {
				result = BigInt(NativeHandler.readUint16(buffer, true, offset));
				if (result <= 0xffn) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 4: {
				result = BigInt(NativeHandler.readUint32(buffer, true, offset));
				if (result <= 0xffffn) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 8: {
				// Must not reach 2⁴⁸!
				result = NativeHandler.readUint64(buffer, true, offset);
				if (result <= 0xffffffffn) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 64-bit integer read state.`));
			};
		};
		return result >> 2n;
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer */
	static readTBigInt64(buffer, offset = 0) {
		this.assertU8(buffer);
		let result;
		switch (this.sizeTInt64(buffer, offset)) {
			case 0: {
				throw(new Error(`Incomplete tagged 64-bit integer.`));
				break;
			};
			case 1: {
				result = BigInt(buffer[offset]);
				break;
			};
			case 2: {
				result = BigInt(NativeHandler.readInt16(buffer, true, offset));
				if (result <= 0x7fn && result >= -0x80n) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 4: {
				result = BigInt(NativeHandler.readInt32(buffer, true, offset));
				if (result <= 0x7fffn && result >= -0x8000n) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			case 8: {
				// Must not reach 2⁴⁸!
				result = NativeHandler.readInt64(buffer, true, offset);
				if (result <= 0x7fffffffn && result >= -0x80000000n) {
					if (this.useStrict) {
						throw(new TypeError(errorMsgNC));
					} else {
						console.warn(errorMsgNC);
					};
				};
				break;
			};
			default: {
				throw(new Error(`Invalid tagged 64-bit integer read state.`));
			};
		};
		return result >> 2n;
	};
};

export {
	TIntReader
};