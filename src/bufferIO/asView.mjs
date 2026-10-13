// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

const dummySymbol = Symbol();

const dummyBufferA = new Uint16Array(1);
const dummyBufferB = new Uint8Array(dummyBufferA.buffer);
dummyBufferA[0] = 256;
const isLittleEndianNative = dummyBufferB[1] === 1;

/** @param {ArrayBufferView} fromView
* @param {import("../nativeType/index.d.mts").ArrayBufferViewConstructors<T>} targetConstructor
* @returns {T} */
const asView = function (fromView, targetConstructor, isLittleEndian = isLittleEndianNative) {
	switch (targetConstructor) {
		case DataView:
		case Int8Array:
		case Uint8Array: {
			return new targetConstructor(fromView.buffer, fromView.byteOffset, fromView.byteLength);
			break;
		};
		case BigInt64Array:
		case BigUint64Array:
		case self.Float16Array ?? dummySymbol:
		case Float32Array:
		case Float64Array:
		case Int16Array:
		case Int32Array:
		case Uint16Array:
		case Uint32Array: {
			if (fromView.byteLength % targetConstructor.BYTES_PER_ELEMENT > 0) {
				throw(new TypeError(`The target "${targetConstructor.name}" view cannot cleanly represent the source view.`));
			};
			const targetElementCount = fromView.byteLength / targetConstructor.BYTES_PER_ELEMENT;
			if (isLittleEndianNative == isLittleEndian) {
				return new targetConstructor(fromView.buffer, fromView.byteOffset, targetElementCount);
			} else {
				const newView = new targetConstructor(targetElementCount);
				const oldView = new DataView(fromView.buffer, fromView.byteOffset, fromView.byteLength);
				for (let i = 0; i < targetElementCount; i ++) {
					switch (targetConstructor) {
						case BigInt64Array: {
							newView[i] = oldView.getBigInt64(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case BigUint64Array: {
							newView[i] = oldView.getBigUint64(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case self.Float16Array ?? 0: {
							newView[i] = oldView.getFloat16(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case Float32Array: {
							newView[i] = oldView.getFloat32(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case Float64Array: {
							newView[i] = oldView.getFloat64(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case Int16Array: {
							newView[i] = oldView.getInt16(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case Int32Array: {
							newView[i] = oldView.getInt32(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case Uint16Array: {
							newView[i] = oldView.getUint16(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
						case Uint32Array: {
							newView[i] = oldView.getUint32(i * newView.BYTES_PER_ELEMENT, isLittleEndian);
							break;
						};
					};
				};
				return newView;
			};
		};
		default: {
			throw(new TypeError(`Invalid target type.`));
		};
	};
};

export {
	asView,
	isLittleEndianNative
};