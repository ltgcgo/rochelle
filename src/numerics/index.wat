;; 2026 © Lightingale Community
;; Licensed under GNU LGPL v3.0 license.

;; Direct WASM operations exposure.
(module
	;; Bitwise operations
	(func
		(export "i32I32Rotl")
		(param $value i32)
		(param $shift i32)
		(result i32)
		local.get $value
		local.get $shift
		i32.rotl
	)
	(func
		(export "i32I32Rotr")
		(param $value i32)
		(param $shift i32)
		(result i32)
		local.get $value
		local.get $shift
		i32.rotr
	)
	(func
		(export "i32Clz")
		(param $value i32)
		(result i32)
		local.get $value
		i32.clz
	)
	(func
		(export "i32Ctz")
		(param $value i32)
		(result i32)
		local.get $value
		i32.ctz
	)
	(func
		(export "i32Popcnt")
		(param $value i32)
		(result i32)
		local.get $value
		i32.popcnt
	)
	(func
		(export "i64I32Rotl")
		(param $value i64)
		(param $shift i32)
		(result i64)
		local.get $value
		local.get $shift
		i64.extend_i32_u
		i64.rotl
	)
	(func
		(export "i64I32Rotr")
		(param $value i64)
		(param $shift i32)
		(result i64)
		local.get $value
		local.get $shift
		i64.extend_i32_u
		i64.rotr
	)
	(func
		(export "i64I64Rotl")
		(param $value i64)
		(param $shift i64)
		(result i64)
		local.get $value
		local.get $shift
		i64.rotl
	)
	(func
		(export "i64I64Rotr")
		(param $value i64)
		(param $shift i64)
		(result i64)
		local.get $value
		local.get $shift
		i64.rotr
	)
	(func
		(export "i64Clz")
		(param $value i64)
		(result i32)
		local.get $value
		i64.clz
		i32.wrap_i64
	)
	(func
		(export "i64Ctz")
		(param $value i64)
		(result i32)
		local.get $value
		i64.ctz
		i32.wrap_i64
	)
	(func
		(export "i64Popcnt")
		(param $value i64)
		(result i32)
		local.get $value
		i64.popcnt
		i32.wrap_i64
	)
	;; Conversions
	(func
		(export "f32AsI32")
		(param $value f32)
		(result i32)
		local.get $value
		i32.reinterpret_f32
	)
	(func
		(export "f32Promote")
		(param $value f32)
		(result f64)
		local.get $value
		f64.promote_f32
	)
	(func
		(export "f64AsI64")
		(param $value f64)
		(result i64)
		local.get $value
		i64.reinterpret_f64
	)
	(func
		(export "f64Demote")
		(param $value f64)
		(result f32)
		local.get $value
		f32.demote_f64
	)
	(func
		(export "i32AsF32")
		(param $value i32)
		(result f32)
		local.get $value
		f32.reinterpret_i32
	)
	(func
		(export "i64AsF64")
		(param $value i64)
		(result f64)
		local.get $value
		f64.reinterpret_i64
	)
)