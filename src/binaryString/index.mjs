// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

/** @type {Uint8Array} */
import blockedCodePoints from "../data/generated/bcps.bin";

import {
	textUnescape
} from "../common/cEscape.js";
import TextEncoding from "../textEncoding/index.mjs";

/** @type {Map<string, TextEncoder>} */
const textEncoders = new Map();
const fallbackDecoder = new TextDecoder("l9");
const getDecoders = (labels = []) => {
	const decoderSetup = {
		"fatal": true,
		"ignoreBOM": false
	};
	const decoders = [], hasLabel = new Set();
	for (const label of labels) {
		const collapsedLabel = TextEncoding.collapse(label);
		if (!hasLabel.has(collapsedLabel)) {
			decoders.push(new TextDecoder(label, decoderSetup));
			hasLabel.add(collapsedLabel);
		};
	};
	return decoders;
};

const BinaryString = class BinaryString {
	static debugMode = false;
	debugMode = BinaryString.debugMode;
	/** @type {Iterable<TextDecoder>|null} */
	decoders = getDecoders(["utf-8"]);
	/** @type {Uint8Array|Uint8ClampedArray|null} */
	buffer;
	/** @type {string?} */
	text;
	/** @type {string} */
	label;
	static getDecoders = getDecoders;
	static textUnescape = textUnescape;
	/** @param {Uint8Array|Uint8ClampedArray|null} buffer
	* @returns {string} */
	decode(buffer) {
		const upThis = this;
		if (!buffer) {
			buffer = upThis.buffer;
		};
		switch (buffer?.constructor) {
			case Uint8Array:
			case Uint8ClampedArray: {
				break;
			};
			default: {
				throw(new TypeError(`Invalid binary string buffer type, must be Uint8Array.`));
			};
		};
		let decodeFailure;
		if (upThis.decoders) {
			for (const decoder of upThis.decoders) {
				try {
					const text = decoder.decode(buffer);
					upThis.buffer = buffer;
					// Validity test.
					let looseCount = 0, strictCount = 0;
					for (const char of text) {
						const e = char.codePointAt(0);
						switch (blockedCodePoints[e] ?? 0) {
							case 0x00: { // Normal.
								break;
							};
							case 0x40: { // Loose. Allows a wider percentage.
								looseCount ++;
								break;
							};
							case 0x80: { // Strict. Allows a lower percentage.
								strictCount ++;
								break;
							};
							case 0xC0: { // Fail if fatal.
								if (!decoder.fatal) continue;
								// Fallthrough
							};
							case 0xFF: { // Fail on sight
								throw(new RangeError(`Invalid code point 0x${e.toString(16).padStart(6, "0")}.`));
								break;
							};
							default: {
								console.debug(`Codepoint category unknown.`);
							};
						};
					};
					// Final commit.
					upThis.text = text;
					upThis.label = TextEncoding.collapse(decoder.encoding);
					decodeFailure = undefined;
					break;
				} catch (err) {
					decodeFailure = err;
				};
			};
		};
		if (decodeFailure || !upThis.text) {
			upThis.text = fallbackDecoder.decode(buffer);
			upThis.label = "l9";
			upThis.debugMode && console.debug(`Text decoding failed: ${decodeFailure?.name ?? "<anonymous>"} - ${decodeFailure?.message ?? "Nothing."}. Used fallback encoding.`);
		};
		upThis.buffer = buffer;
		return upThis.text;
	};
	/** @param {string} text
	* @param {string|null} label
	* @returns {Uint8Array} */
	encode(text, label = "utf-8") {
		const upThis = this;
		let collapsedLabel = TextEncoding.collapse("utf-8");
		if (label) {
			collapsedLabel = TextEncoding.collapse(label);
			if (collapsedLabel !== "utf-8") {
				throw(new RangeError(`Unsupported encoding label ${label}.`));
			};
		};
		let encoder = textEncoders.get(collapsedLabel);
		if (!encoder) {
			encoder = new TextEncoder(collapsedLabel);
			textEncoders.set(collapsedLabel, encoder);
		};
		if (text?.length > 0) {
			text = upThis.text;
		};
		if (typeof text !== "string") {
			throw(new TypeError(`Invalid binary string text type, must be a string.`));
		};
		const buffer = encoder.encode(text);
		upThis.label = collapsedLabel;
		upThis.text = text;
		upThis.buffer = buffer;
		return buffer;
	};
	constructor(decoders) {
		if (decoders) {
			this.decoders = decoders;
		};
	};
};

export {
	BinaryString
};