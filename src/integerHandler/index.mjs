// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.
// Originally from Seamstress.

"use strict";

const bigIntMaxBoundary = (1n << 1024n) - 1n;
const bigIntCastCeil = (1n << 1023n);

const linkedF64View = new Float64Array(1);
const linkedU64View = new BigUint64Array(linkedF64View.buffer);

export default class IntegerHandler {
	static MASK_VLV = 128;
	static MASK_RVLV = 192;
	static RVLV_START = 192;
	static RVLV_MIDDLE = 128;
	static RVLV_END = 64;
	static RVLV_SINGLE = 0;
	static useNative = true;
	static useStrict = true;
	static #unsafeType = false;
	static #hiddenDataView = Symbol("Key for the hidden DataView.");
	static #ensureUnsafe() {};
	static #ensureU8Safe(buffer) {
		/*if (buffer.constructor !== Uint8Array && buffer.constructor !== Uint8ClampedArray) {
			throw(new TypeError("Input must be a Uint8Array."));
		};*/
		switch (buffer.constructor) {
			case Uint8Array:
			case Uint8ClampedArray: {
				return;
				break;
			};
			default: {
				throw(new TypeError("Input must be a Uint8Array."));
			};
		};
	};
	static #ensureNumberSafe(value) {
		if (typeof value !== "number") {
			throw(new TypeError("Input must be a number."));
		};
		if (!Number.isSafeInteger(value)) {
			throw(new RangeError("Input must be a safe integer."));
		};
	};
	static #ensureBigIntSafe(value) {
		if (typeof value !== "bigint") {
			throw(new TypeError("Input must be a BigInt."));
		};
	};
	static #ensureU8 = this.#ensureU8Safe;
	static #ensureNumber = this.#ensureNumberSafe;
	static #ensureBigInt = this.#ensureBigIntSafe;
	static get unsafeType() {
		return this.#unsafeType;
	};
	static set unsafeType(value) {
		this.#unsafeType = value;
		if (value) {
			this.#ensureU8 = this.#ensureUnsafe;
			this.#ensureNumber = this.#ensureUnsafe;
			this.#ensureBigInt = this.#ensureUnsafe;
		} else {
			this.#ensureU8 = this.#ensureU8Safe;
			this.#ensureNumber = this.#ensureNumberSafe;
			this.#ensureBigInt = this.#ensureBigIntSafe;
		};
	};
	static #obtainDataView(typedArray) {
		// Can use a WeakMap instead.
		if (!typedArray[this.#hiddenDataView]) {
			typedArray[this.#hiddenDataView] = new DataView(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
		};
		return typedArray[this.#hiddenDataView];
	};
	static bitsBigUint(value) {
		// f64 thinks 2^1024-1 is too large, so I can't exploit F-I mantissa-exponent casting. Ouch.
		if (value < 0n) {
			throw(new RangeError(`Must be a non-negative integer.`));
		} else if (value > bigIntMaxBoundary) {
			throw(new RangeError(`Value too large. Must be within 1024 bits.`));
		} else if (value === 0n) {
			return 0;
		} else if (value > bigIntCastCeil) {
			return 1024;
		} else if (value >= 9007199254740992n) {
			//throw(new Error("WIP"));
			// Expand phase
			//let minBoundary = 0, maxBoundary = 0;
			//let maxPowerSplit = 1n;
			/*let maxPowerSplit = 32n;
			for (let power = 6; power <= 10; power ++) {
				//if (power > 0) {
					//maxPowerSplit <<= 1n;
					//minBoundary = 1 << (power - 1);
				//};
				maxPowerSplit <<= 1n;
				if ((value >> maxPowerSplit) === 0n) {
					maxBoundary = 1 << power;
					minBoundary = 1 << (power - 1);
					break;
				};
			};*/
			// Collapse phase
			let minBoundary = 0, maxBoundary = 1024;
			while (maxBoundary - minBoundary > 1) {
				const step = (maxBoundary - minBoundary) >> 1;
				const splitPoint = step + minBoundary;
				if (value >> BigInt(splitPoint) > 0n) {
					minBoundary = splitPoint;
				} else {
					maxBoundary = splitPoint;
				};
				//break;
			};
			return maxBoundary;
		} else {
			// This method is not quite accurate for very large numbers, so a range guard is required.
			linkedF64View[0] = Number(value);
			const rawExponent = (linkedU64View[0] >> 52n) & 2047n;
			return Number(BigInt.asUintN(16, rawExponent)) - 1022;
		};
	};
	static readVLV(buffer, offset = 0) {
		// VLV-8 are all big-endian.
		this.#ensureU8(buffer);
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
	static readVLVBigInt(buffer, offset = 0) {
		// VLV-8 are all big-endian.
		this.#ensureU8(buffer);
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
	static sizeVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
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
	static lengthVLV(value) {
		this.#ensureNumber(value);
		if (value < 0 || value > 268435455) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^28.`));
		};
		return value === 0 ? 1 : Math.floor((38 - Math.clz32(value)) / 7);
	};
	static lengthVLVBigInt(value) {
		this.#ensureBigInt(value);
		if (value < 0n || value > 0xffffffffffffffffffffffffffffn) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^112.`));
		};
		return value === 0n ? 1 : Math.floor((this.bitsBigUint(value) + 6) / 7);
	};
	static writeVLV(buffer, value, offset = 0) {
		this.#ensureU8(buffer);
		this.#ensureNumber(value);
		const vlvSize = this.lengthVLV(value);
		let view = value, setBit = 0;
		for (let ptr = vlvSize - 1; ptr >= 0; ptr --) {
			buffer[offset + ptr] = setBit | (view & 127);
			setBit = 128;
			view >>= 7;
		};
	};
	static writeVLVBigInt(buffer, value, offset = 0) {
		this.#ensureU8(buffer);
		this.#ensureBigInt(value);
		const vlvSize = this.lengthVLVBigInt(value);
		let view = value, setBit = 0;
		for (let ptr = vlvSize - 1; ptr >= 0; ptr --) {
			buffer[offset + ptr] = setBit | Number(view & 127n);
			setBit = 128;
			view >>= 7n;
		};
	};
	static emitVLV(value) {
		const buffer = new Uint8Array(this.lengthVLV(value));
		this.writeVLV(buffer, value);
		return buffer;
	};
	static emitVLVBigInt(value) {
		const buffer = new Uint8Array(this.lengthVLVBigInt(value));
		this.writeVLVBigInt(buffer, value);
		return buffer;
	};
	static readRVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
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
	static readRVLVBigInt(buffer, offset = 0) {
		this.#ensureU8(buffer);
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
	static sizeRVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
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
	static lengthRVLV(value) {
		this.#ensureNumber(value);
		if (value < 0 || value > 16777215) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^24.`));
		};
		return value === 0 ? 1 : Math.floor((37 - Math.clz32(value)) / 6);
	};
	static lengthRVLVBigInt(value) {
		this.#ensureBigInt(value);
		if (value < 0n || value > 0xffffffffffffffffffffffffn) {
			throw(new RangeError(`Input range invalid. Must be a non-negative integer below 2^96.`));
		};
		return value === 0n ? 1 : Math.floor((this.bitsBigUint(value) + 5) / 6);
	};
	static readBool(buffer, offset = 0) {
		/*if (this.useNative && wasmExports) {
			return wasmExports.readBitAt(buffer[offset >> 3], offset);
		} else {*/
			this.#ensureU8(buffer);
			if (this.#ensureU8 && (offset < 0 || offset > 4294967295 || (offset >>> 3) >= buffer.length)) {
				throw(new RangeError(`Invalid binary offset. (${offset})`));
			};
			return buffer[offset >> 3] >> (offset & 7) & 1;
		//};
	};
	static readInt8(buffer, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getInt8(offset);
		} else {
			this.#ensureU8(buffer);
			if (offset < 0 || offset >= buffer.length) {
				throw(new RangeError(`Invalid offset. (${offset})`));
			};
			let result = buffer[offset];
			if (result >> 7) {
				result -= 256;
			};
			return result;
		};
	};
	static readUint16(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getUint16(offset, isLittleEndian);
		} else {
			this.#ensureU8(buffer);
			if (offset < 0 || offset + 1 >= buffer.length) {
				throw(new RangeError(`Invalid offset. (${offset})`));
			};
			let result = buffer[offset];
			if (isLittleEndian) {
				for (let i = 1; i < 2; i ++) {
					result |= buffer[offset + i] << (i << 3);
				};
			} else {
				for (let i = 1; i < 2; i ++) {
					result <<= 8;
					result |= buffer[offset + i];
				};
			};
			return result;
		};
	};
	static readInt16(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getInt16(offset, isLittleEndian);
		} else {
			let result = this.readUint16(buffer, isLittleEndian, offset);
			if (result >>> 15) {
				return result - 65536;
			} else {
				return result;
			};
		};
	};
	static readUint24(buffer, isLittleEndian = false, offset = 0) {
		this.#ensureU8(buffer);
		if (offset < 0 || offset + 2 >= buffer.length) {
			throw(new RangeError(`Invalid offset. (${offset})`));
		};
		/*if (this.useNative) {
			if (isLittleEndian) {
				return this.#obtainDataView(buffer).getUint16(offset, isLittleEndian) | (buffer[offset + 2] << 16);
			} else {
				return (this.#obtainDataView(buffer).getUint16(offset, isLittleEndian) << 8) | buffer[offset + 2];
			};
		} else {*/
			if (isLittleEndian) {
				return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
			} else {
				return (buffer[offset] << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2];
			};
		//};
	};
	static readInt24(buffer, isLittleEndian = false, offset = 0) {
		let result = this.readUint24(buffer, isLittleEndian, offset);
		if (result < 8388608) {
			return result;
		} else {
			return result - 16777216;
		};
	};
	static readInt32(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getInt32(offset, isLittleEndian);
		} else {
			this.#ensureU8(buffer);
			if (offset < 0 || offset + 3 >= buffer.length) {
				throw(new RangeError(`Invalid offset. (${offset})`));
			};
			let result = buffer[offset];
			if (isLittleEndian) {
				for (let i = 1; i < 4; i ++) {
					result |= buffer[offset + i] << (i << 3);
				};
			} else {
				for (let i = 1; i < 4; i ++) {
					result <<= 8;
					result |= buffer[offset + i];
				};
			};
			return result;
		};
	};
	static readUint32(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getUint32(offset, isLittleEndian);
		} else {
			let result = this.readInt32(buffer, isLittleEndian, offset);
			if (result >>> 31) {
				return 4294967296 + result;
			} else {
				return result;
			};
		};
	};
	static readUint64(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getBigUint64(offset, isLittleEndian);
		} else {
			this.#ensureU8(buffer);
			if (offset < 0 || offset + 7 >= buffer.length) {
				throw(new RangeError(`Invalid offset. (${offset})`));
			};
			let result = BigInt(buffer[offset]);
			if (isLittleEndian) {
				for (let i = 1; i < 8; i ++) {
					result |= BigInt(buffer[offset + i]) << BigInt(i << 3);
				};
			} else {
				for (let i = 1; i < 8; i ++) {
					result <<= 8n;
					result |= BigInt(buffer[offset + i]);
				};
			};
			return result;
		};
	};
	static readInt64(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.#obtainDataView(buffer).getBigInt64(offset, isLittleEndian);
		} else {
			let result = this.readUint64(buffer, isLittleEndian, offset);
			if (result >> 63n) {
				return result - 18446744073709551616n;
			} else {
				return result;
			};
		};
	};
};