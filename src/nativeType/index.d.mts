// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Fake classes intended to specify native types. For documentation only.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.nativeType
*/

// Fake signed integers.
export type int8 = number
export type int16 = number
export type int32 = number
export type int64 = bigint
export type int128 = bigint
export type isize = bigint

// Fake unsigned integers.
export type uint8 = number
export type uint16 = number
export type uint32 = number
export type uint64 = bigint
export type uint128 = bigint
export type usize = bigint
export type uintptr = bigint

// Fake floats.
export type float16 = number
export type float32 = number
export type float64 = number
// JS cannot represent f128.
export type complex32 = Float32Array
export type complex64 = Float32Array
export type complex128 = Float64Array
export type quaternion64 = Float32Array
export type quaternion128 = Float32Array
export type quaternion256 = Float64Array

// Endian-specific.
export type i8be = int8
export type i8le = int8
export type i16be = int16
export type i16le = int16
export type i32be = int32
export type i32le = int32
export type i64be = int64
export type i64le = int64
export type i128be = int128
export type i128le = int128
export type u8be = int8
export type u8le = int8
export type u16be = int16
export type u16le = int16
export type u32be = int32
export type u32le = int32
export type u64be = int64
export type u64le = int64
export type u128be = int128
export type u128le = int128

// Aliases.
export type byte = uint8
export type rune = int32

/** Floating point typed arrays. */
export type FloatArray = /*Float16Array|*/Float32Array|Float64Array;
/** Signed integer typed arrays. */
export type IntArray = Int8Array|Int16Array|Int32Array;
/** Unsigned integer typed arrays. */
export type Uint8Arrays = Uint8Array|Uint8ClampedArray;
export type UintArray = Uint8Arrays|Uint16Array|Uint32Array;
/** BigInt typed arrays. */
export type BigIntArray = BigInt64Array|BigUint64Array;
/** All typed arrays. */
export type TypedArray = IntArray|UintArray|BigIntArray|FloatArray;
export type TypedArrayConstructors<T extends TypedArray> = new (...args: any[]) => T;
export type ArrayBufferViewConstructors<T extends ArrayBufferView> = new (...args: any[]) => T;
