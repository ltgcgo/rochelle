// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import bufferMaps from "./maps.mjs";

// Prevents dependents using this as fallbacks from causing infinite loops.
const useHexDecOffload = Object.hasOwn(Uint8Array, "fromHex");
const useB64DecOffload = Object.hasOwn(Uint8Array, "fromBase64");

/** @param {string} alphabet
* @param {string} string
* @param {string} lastChunkHandling
* @param {number} maxLength
* @returns {Uint8Array} */
const bufferFrom = function (alphabet = "base64", string, lastChunkHandling = "loose", maxLength = 536870911) {
	if (typeof string !== "string") {
		throw(new TypeError("Input is not a string."));
	};
	if (!bufferMaps[1].has(alphabet)) {
		throw(new TypeError(`Alphabet "${alphabet}" is not supported.`));
	};
	let decodeMap = bufferMaps[1].get(alphabet);
	let encodeMapSize = bufferMaps[0].get(alphabet).length;
	let buffer;
	switch (alphabet) {
		case "hex": {
			if (useHexDecOffload) {
				// Use the built-in method whenever available.
				return Uint8Array.fromHex(string);
			};
			if (string.length & 1) {
				throw(new SyntaxError("The hex string must have an even number of characters."));
			};
			let maxReadLength = Math.min(string.length, maxLength << 1),
			trueReadLength = 0;
			buffer = new Uint8Array(maxReadLength >>> 1);
			for (let i = 0; i < maxReadLength; i ++) {
				let charCode = string.charCodeAt(i);
				if (charCode >= decodeMap.length) {
					throw(new SyntaxError(`"${string[i]}" exceeded decoding capabilities.`));
				};
				let decodedByte = decodeMap[charCode];
				switch (decodedByte) {
					case 254: {
						break;
					};
					case 255: {
						throw(new SyntaxError(`"${string[i]}" is not a valid hex-digit.`));
						break;
					};
					default: {
						if (decodedByte < encodeMapSize) {
							buffer[trueReadLength >> 1] |= decodedByte << (trueReadLength & 1 ? 0 : 4);
							trueReadLength ++;
						} else {
							throw(new SyntaxError(`"${string[i]}" caused an unexpected error.`));
						};
					};
				};
			};
			buffer = buffer.subarray(0, trueReadLength >> 1);
			break;
		};
		default: {
			// Base64 with various alphabets
			if (useB64DecOffload) {
				// Use the built-in method whenever available.
				switch (alphabet) {
					case "base64":
					case "base64url": {
						return Uint8Array.fromBase64(string, {
							alphabet,
							lastChunkHandling
						});
						break;
					};
				};
			};
			let maxReadLength = Math.min(string.length, Math.ceil((maxLength << 2) / 3)), trueEmitSize = 0;
			buffer = new Uint8Array((maxReadLength * 3) >> 2);
			let readRawSize = 0, readPaddingSize = 0, window3Triple = 0;
			for (let i = 0; i < maxReadLength; i ++) {
				let window3Nibble = readRawSize & 3;
				let charCode = string.charCodeAt(i);
				if (charCode >= decodeMap.length) {
					throw(new SyntaxError(`"${string[i]}" exceeded decoding capabilities.`));
				};
				let decodedByte = decodeMap[charCode];
				//console.debug(decodedByte, i & 3);
				switch (decodedByte) {
					case 253: {
						readPaddingSize ++;
						// Fallthrough.
					};
					case 254: {
						break;
					};
					case 255: {
						throw(new SyntaxError(`"${string[i]}" is not in the selected alphabet.`));
						break;
					};
					default: {
						readPaddingSize = 0;
						if (decodedByte < encodeMapSize) {
							switch (alphabet) {
								case "ovm43": {
									if (window3Nibble > 0) {
										// Payload
										buffer[window3Triple - 1 + window3Nibble] |= decodedByte;
										if (window3Nibble === 3) {
											window3Triple += 3;
										};
										trueEmitSize ++;
									} else {
										// Overlay
										let recursionGate = Math.min(3, maxReadLength - window3Triple),
										rollingByte = decodedByte;
										for (let i0 = 0; i0 < recursionGate; i0 ++) {
											buffer[window3Triple + i0] = (rollingByte & 3) << 6;
											rollingByte >>= 2;
										};
									};
									break;
								};
								default: {
									if (window3Nibble < 3) {
										buffer[window3Triple + window3Nibble] = (decodedByte << ((window3Nibble + 1) << 1)) & 255;
									};
									if (window3Nibble > 0) {
										buffer[window3Triple + window3Nibble - 1] |= decodedByte >> ((3 - window3Nibble) << 1);
										trueEmitSize ++;
									};
									if (window3Nibble === 3) {
										window3Triple += 3;
									};
								};
							};
							readRawSize ++;
						} else {
							throw(new SyntaxError(`"${string[i]}" caused an unexpected error.`));
						};
					};
				};
			};
			let readSizeValidate = readRawSize & 3;
			switch (readSizeValidate) {
				case 0: {
					// Complete Base64.
					break;
				};
				case 1: {
					throw(new SyntaxError("Unexpected incomplete base64 chunk."));
					break;
				};
				case 2:
				case 3: {
					switch (lastChunkHandling) {
						case "strict": {
							let lastPadAt = string.length, i = 0;
							//console.debug(lastPadAt);
							while (string.charCodeAt(lastPadAt - 1) === 61 && lastPadAt > 0) {
								lastPadAt --;
								//console.debug(lastPadAt);
							};
							if (((string.length - lastPadAt + readSizeValidate) & 3) !== 0) {
								throw(new SyntaxError("Unexpected incomplete base64 chunk."));
							};
							break;
						};
						case "stop-before-partial": {
							// WIP: Gave up for now, will revisit later.
							buffer = buffer.subarray(0, ((readRawSize + Math.max(2, readPaddingSize)) * 3) >> 2);
							break;
						};
						default: {
							// Same as "loose"
							buffer = buffer.subarray(0, trueEmitSize);
						};
					};
					break;
				};
			};
		};
	};
	return buffer;
};

/** @param {string} alphabet
* @param {Uint8Array} buffer
* @param {boolean} omitPadding
* @returns {string} */
const bufferTo = function (alphabet = "base64", buffer, omitPadding = false) {};

export {
	bufferFrom,
	bufferTo
};