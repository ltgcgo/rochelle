;; 2025-2026 © Lightingale Community
;; Licensed under GNU LGPL v3.0 license.

(module
	(func (export "readBitAt") (param i32 i32) (result i32)
		local.get 0 ;; Incoming bit-field.
		local.get 1 ;; Bit position.
		i32.const 7 ;; Only uint8.
		i32.and
		i32.shr_u
		i32.const 1
		i32.and
	)
)
