// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.
// Originally from Seamstress.

"use strict";

// Must not import anything.

export default class BaseIntegerHandler {
	static useNative = true;
	static useStrict = true;
	static #unsafeType = false;
	static #ensureUnsafe() {};
	/** @param {unknown} buffer
	* @protected
	* @returns {asserts buffer is import("../nativeType/index.d.mts").Uint8Arrays} */
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
	/** @param {unknown} value
	* @protected
	* @returns {asserts value is number} */
	static #ensureNumberSafe(value) {
		if (typeof value !== "number") {
			throw(new TypeError("Input must be a number."));
		};
		if (!Number.isSafeInteger(value)) {
			throw(new RangeError("Input must be a safe integer."));
		};
	};
	/** @param {unknown} value
	* @protected
	* @returns {asserts value is bigint} */
	static #ensureBigIntSafe(value) {
		if (typeof value !== "bigint") {
			throw(new TypeError("Input must be a BigInt."));
		};
	};
	static assertU8 = this.#ensureU8Safe;
	static assertNumber = this.#ensureNumberSafe;
	static assertBigInt = this.#ensureBigIntSafe;
	static get unsafeType() {
		return this.#unsafeType;
	};
	static set unsafeType(value) {
		this.#unsafeType = value;
		if (value) {
			this.assertU8 = this.#ensureUnsafe;
			this.assertNumber = this.#ensureUnsafe;
			this.assertBigInt = this.#ensureUnsafe;
		} else {
			this.assertU8 = this.#ensureU8Safe;
			this.assertNumber = this.#ensureNumberSafe;
			this.assertBigInt = this.#ensureBigIntSafe;
		};
	};
	/** @type {WeakMap<import("../nativeType/index.d.mts").TypedArray, DataView>} */
	static #wmapDataView = new WeakMap();
	/** @param {import("../nativeType/index.d.mts").TypedArray} typedArray
	* @protected */
	static grabDataView(typedArray) {
		let wmapResult = this.#wmapDataView.get(typedArray);
		if (wmapResult == null) {
			wmapResult = new DataView(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
			this.#wmapDataView.set(typedArray, wmapResult);
			return wmapResult;
		} else {
			return wmapResult;
		};
	};
	/** @param {bigint} value */
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
};