// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

const u8Enc = new TextEncoder();
/** @type {Map<string,Uint8Array>[]} */
const bufferMaps = [new Map(), new Map()]; // encode and decode array

bufferMaps[0].set("base64", u8Enc.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")); // Defer to the runtime support when available
bufferMaps[0].set("base64url", u8Enc.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")); // Defer to the runtime support when available
bufferMaps[0].set("hex", u8Enc.encode("0123456789abcdef")); // Defer to browser the runtime when available
bufferMaps[0].set("ovm43", u8Enc.encode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"));
bufferMaps[0].set("radix64", u8Enc.encode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/"));
bufferMaps[0].set("radix64url", u8Enc.encode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"));
bufferMaps[0].set("uucommon", u8Enc.encode("`!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_"));
bufferMaps[0].set("uu", u8Enc.encode(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_"));
bufferMaps[0].set("xml", u8Enc.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_."));
bufferMaps[0].set("xx", u8Enc.encode("+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"));
bufferMaps[0].set("xxurl", u8Enc.encode("_-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"));
bufferMaps[0].set("y64", u8Enc.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._"));
bufferMaps[0].set("z64", u8Enc.encode("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"));
bufferMaps[0].set("z64url", u8Enc.encode("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"));

for (let [key, value] of bufferMaps[0]) {
	let decodeMap = (new Uint8Array(128)).fill(255); // 255: invalid
	for (let i = 0; i < value.length; i ++) {
		decodeMap[value[i]] = i;
	};
	// 254: ignore
	switch (key) {
		case "hex": {
			for (let i = 10; i < 16; i ++) {
				decodeMap[i + 55] = i;
			};
			break;
		};
		case "y64": {
			decodeMap[9] = 254;
			decodeMap[10] = 254;
			decodeMap[12] = 254;
			decodeMap[13] = 254;
			decodeMap[32] = 254;
			decodeMap[45] = 253;
			break;
		};
		case "uucommon": {
			decodeMap[32] = 253;
			// Fallthrough.
		};
		case "uustandard": {
			decodeMap[9] = 254;
			decodeMap[10] = 254;
			decodeMap[12] = 254;
			decodeMap[13] = 254;
			break;
		};
		default: {
			decodeMap[9] = 254;
			decodeMap[10] = 254;
			decodeMap[12] = 254;
			decodeMap[13] = 254;
			decodeMap[32] = 254;
			decodeMap[61] = 253;
		};
	};
	bufferMaps[1].set(key, decodeMap);
};

export default bufferMaps;