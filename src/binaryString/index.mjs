// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

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
	/** @type {Iterable<TextDecoder>|null} */
	decoders = getDecoders(["utf-8"]);
	/** @type {Uint8Array|Uint8ClampedArray|null} */
	buffer;
	/** @type {string} */
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
				upThis.buffer = buffer;
				break;
			};
			default: {
				throw(new TypeError(`Invalid binary string buffer type, must be Uint8Array.`));
			};
		};
		let decodeFailed = true;
		if (upThis.decoders) {
			for (const decoder of upThis.decoders) {
				try {
					const text = decoder.decode(buffer);
					// Validity test.
					// Final commit.
					upThis.text = text;
					upThis.label = TextEncoding.collapse(decoder.encoding);
					decodeFailed = false;
					break;
				} catch (err) {};
			};
		};
		if (decodeFailed) {
			upThis.text = fallbackDecoder.decode(buffer);
			upThis.label = "l9";
			console.debug(`Text decoding failed. Used fallback encoding.`);
		};
		upThis.buffer = buffer;
		return upThis.text;
	};
	/** @param {string} text
	* @param {string|null} label
	* @returns {Uint8Array} */
	encode(text, label = "utf-8") {
		let collapsedLabel = TextEncoding.collapse("utf-8");
		if (label) {
			collapsedLabel = TextEncoding.collapse(label);
			if (collapsedLabel !== "utf-8") {
				throw(new RangeError(`Unsupported encoding label ${label}.`));
			};
		};
	};
};

export {
	BinaryString
};