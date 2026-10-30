// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.
// Originally from Seamstress.

"use strict";

import BaseIntegerHandler from "./base.mjs";

// Can only import the base.

const bigIntMaxBoundary = (1n << 1024n) - 1n;
const bigIntCastCeil = (1n << 1023n);

const linkedF64View = new Float64Array(1);
const linkedU64View = new BigUint64Array(linkedF64View.buffer);

export default class NativeHandler extends BaseIntegerHandler {
	// Standard value reads and writes.
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readBool(buffer, offset = 0) {
		/*if (this.useNative && wasmExports) {
			return wasmExports.readBitAt(buffer[offset >> 3], offset);
		} else {*/
			this.assertU8(buffer);
			if (this.assertU8 && (offset < 0 || offset > 4294967295 || (offset >>> 3) >= buffer.length)) {
				throw(new RangeError(`Invalid binary offset. (${offset})`));
			};
			return buffer[offset >> 3] >> (offset & 7) & 1;
		//};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readInt8(buffer, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getInt8(offset);
		} else {
			this.assertU8(buffer);
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
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readUint16(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getUint16(offset, isLittleEndian);
		} else {
			this.assertU8(buffer);
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
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readInt16(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getInt16(offset, isLittleEndian);
		} else {
			let result = this.readUint16(buffer, isLittleEndian, offset);
			if (result >>> 15) {
				return result - 65536;
			} else {
				return result;
			};
		};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readUint24(buffer, isLittleEndian = false, offset = 0) {
		this.assertU8(buffer);
		if (offset < 0 || offset + 2 >= buffer.length) {
			throw(new RangeError(`Invalid offset. (${offset})`));
		};
		/*if (this.useNative) {
			if (isLittleEndian) {
				return this.grabDataView(buffer).getUint16(offset, isLittleEndian) | (buffer[offset + 2] << 16);
			} else {
				return (this.grabDataView(buffer).getUint16(offset, isLittleEndian) << 8) | buffer[offset + 2];
			};
		} else {*/
			if (isLittleEndian) {
				return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
			} else {
				return (buffer[offset] << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2];
			};
		//};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readInt24(buffer, isLittleEndian = false, offset = 0) {
		let result = this.readUint24(buffer, isLittleEndian, offset);
		if (result < 8388608) {
			return result;
		} else {
			return result - 16777216;
		};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readInt32(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getInt32(offset, isLittleEndian);
		} else {
			this.assertU8(buffer);
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
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {number} */
	static readUint32(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getUint32(offset, isLittleEndian);
		} else {
			return this.readInt32(buffer, isLittleEndian, offset) >>> 0;
		};
	};
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {bigint} */
	static readUint64(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getBigUint64(offset, isLittleEndian);
		} else {
			this.assertU8(buffer);
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
	/** @param {import("../nativeType/index.d.mts").TypedArray} buffer
	* @returns {bigint} */
	static readInt64(buffer, isLittleEndian = false, offset = 0) {
		if (this.useNative) {
			return this.grabDataView(buffer).getBigInt64(offset, isLittleEndian);
		} else {
			let result = this.readUint64(buffer, isLittleEndian, offset);
			if (result >> 63n) {
				return result - 18446744073709551616n;
			} else {
				return result;
			};
		};
	};
}