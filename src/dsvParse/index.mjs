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
		let lineData = [""], cellNo = 0;
		let rawStream = stream.getReader();
		return new ReadableStream({
			"pull": async (controller) => {
				let {value, done} = await rawStream.read();
				if (typeof value === "string") {
					controller.enqueue(lineData);
					lineNo ++;
				};
				if (done) {
					controller.close();
				};
			}
		});
	};
};
