// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import {
	textUnescape
} from "../common/cEscape.js";

export default class DsvParser {
	static MASK_TYPE = 0b00000011;
	static MASK_DATA = 0b00001100;
	static TYPE_TSV = 0b00000000;
	static TYPE_CSV = 0b00000001;
	static DATA_TEXT = 0b00000000;
	static DATA_JSON = 0b00000100;
	static parse(mode, stream) {
		let dsvType = mode & this.MASK_TYPE;
		let dsvData = mode & this.MASK_DATA;
		let lineNo = 0, colNo = 0;
		let lineData, cellNo = 0;
		let quoteType;
		let rawStream = stream.getReader();
		return new ReadableStream({
			"pull": async (controller) => {
				let {value, done} = await rawStream.read();
				if (typeof value === "string") {
					switch (dsvType) {
						case this.TYPE_TSV: {
							lineData = [];
							try {
								for (let cellData of value.split("\t")) {
									switch (dsvData) {
										case this.DATA_TEXT: {
											lineData.push(textUnescape(cellData));
											break;
										};
										case this.DATA_JSON: {
											lineData.push(lineNo === 0 ? textUnescape(cellData) : JSON.parse(cellData));
											break;
										};
										default: {
											throw(new TypeError(`Unknown DSV value type ${dsvType}`));
										};
									};
								};
							} catch (err) {
								console.debug(`The following error appeared when parsing on line ${lineNo + 1}.`);
								console.error(err);
							};
							break;
						};
						case this.TYPE_CSV: {
							if (dsvData !== this.DATA_TEXT) {
								throw(new TypeError(`Invalid type ${dsvType} for CSV, only plain text is allowed`));
							} else {};
							break;
						};
						default: {
							throw(new TypeError(`Unknown DSV type ${dsvType}`));
						};
					};
					controller.enqueue(lineData);
					lineNo ++;
				};
				if (done) {
					controller.close();
				};
			}
		});
	};
	static parseObjects(mode, stream) {
		let lineNo = 0, textStream = this.parse(mode, stream).getReader();
		let fields;
		return new ReadableStream({
			"start": async (controller) => {
				let {value, done} = await textStream.read();
				if (typeof value?.length === "number") {
					fields = value;
				};
				if (done) {
					controller.close();
				};
			},
			"pull": async (controller) => {
				let {value, done} = await textStream.read();
				if (typeof value?.length === "number") {
					let obj = {};
					for (let i = 0; i < value.length; i ++) {
						if (value[i]) {
							obj[fields[i]] = value[i];
						};
					};
					controller.enqueue(obj);
				};
				if (done) {
					controller.close();
				};
			}
		});
	};
};
