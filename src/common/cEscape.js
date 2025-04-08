// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

// A strict, language neutral implementation of escaping and unescaping characters.
// \x: strictly 2 hex characters, escape level 3 if above 0x7f
// \u: strictly 4 hex characters, escape level 2 if above 0xff
// \U: strictly 8 hex characters, escape level 1 if above 0xffff, will truncate to a range of 0x000000 to 0x10ffff in JavaScript.

const unescapeMap = {
	"0": "\x00",
	"a": "\x07",
	"b": "\x08",
	"e": "\x1b",
	"f": "\x0c",
	"n": "\x0a",
	"r": "\x0d",
	"t": "\x09",
	"v": "\x0b",
	"\\": "\x5c",
	"'": "\x27",
	'"': '\x22'
}; // This always take precedence.
const charType = new Uint8Array(128);
charType.fill(1, 0x30, 0x3a);
charType.fill(1, 0x41, 0x47);
charType.fill(1, 0x61, 0x67);
// no escape, code point, substitution, dependent on quote
const alwaysEscaped = new Uint8Array(256);
alwaysEscaped.fill(1, 0x0, 0x20);
alwaysEscaped.fill(1, 0x80, 0xa0);
alwaysEscaped[0x7f] = 1;
const escapeMap = {};
for (let key in unescapeMap) {
	let target = unescapeMap[key];
	escapeMap[target] = `\\${key}`;
	alwaysEscaped[target.charCodeAt(0)] = 2;
};
alwaysEscaped[0x22] = 3;
alwaysEscaped[0x27] = 3;

const textUnescape = (text) => {
	let result = "", escaped = false;
	// Characters exceeding BMP won't change the unescaping flow
	for (let i0 = 0; i0 < text.length; i0 ++) {
		let e0 = text[i0];
		if (escaped) {
			let uDecLength = 0;
			switch (e0) {
				case "x": {
					uDecLength = 2;
					break;
				};
				case "u": {
					uDecLength = 4;
					break;
				};
				case "U": {
					uDecLength = 8;
					break;
				};
				default: {
					let char = unescapeMap[e0];
					if (typeof char === "string") {
						result += char;
					} else {
						throw(new Error(`Invalid escape identifier "${e0}" at index ${i0}`));
					};
					escaped = false;
					continue;
				};
			};
			if (uDecLength > 0) {
				let startIndex = i0 + 1;
				let codePointRaw = text.substring(startIndex, startIndex + uDecLength);
				if (codePointRaw.length < uDecLength) {
					throw(new RangeError(`Insufficient code point buffer "${codePointRaw}" at index ${startIndex}`));
				};
				let codePoint = parseInt(codePointRaw, 16);
				if (Number.isNaN(codePoint)) {
					throw(new RangeError(`Malformed code point representation "${codePointRaw}" at index ${startIndex}`));
				} else if (codePoint >= 0x110000) {
					throw(new RangeError(`Code point "${codePointRaw}" exceeds 0x10ffff at index ${startIndex}`));
				} else {
					result += String.fromCodePoint(codePoint);
				};
				escaped = false;
				// Decode complete
				i0 += uDecLength;
			};
		} else if (e0 === "\\") {
			escaped = true;
		} else {
			result += e0;
		};
	};
	return result;
};
const textEscape = (text, escapeLevel = 0) => {
	// Characters exceeding BMP will change the escaping flow
};

self.textUnescape = textUnescape;
self.TextEscape = textEscape;

export {
	textUnescape,
	textEscape
};
