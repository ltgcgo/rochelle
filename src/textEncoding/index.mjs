// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

// Also may need to add custom decoders for ISO-2022-KR and TCVN-5773-1993
// Conversion between ISO-2022 and EUC is a bitch... ISO-2022 is stateful which needs special handling. Maybe support for ISO-2022 encodings shouldn't be added at all.
// Maybe stateful encodings should be left unsupported, after all.

import collapsedFromLabels from "./collapsedLabels.json";
import collapsedBEI from "./bei.json";

export default class TextEncoding {
	static BYTE_1 = 0;
	static BYTE_2_LE = 2;
	static BYTE_2_BE = 3;
	static BYTE_3_LE = 4;
	static BYTE_3_BE = 5;
	static BYTE_4_LE = 6;
	static BYTE_4_BE = 7;
	static getUnitSize(indicator) {
		if (indicator > 7) {
			throw(new RangeError("Cannot decode encodings with more than 4 bits per unit."));
		};
		return indicator >> 1;
	};
	static isBigEndian(indicator) {
		return indicator & 1;
	};
	static collapse(label) {
		let collapsed = collapsedFromLabels[label];
		if (typeof collapsed !== "string") {
			throw(new TypeError(`Provided label "${label}" is not supported.`));
		};
		return collapsed;
	};
	static indicator(collapsed) {
		let indicator = collapsedBEI[collapsed];
		if (typeof indicator !== "number") {
			throw(new TypeError(`Provided collapsed label "${collapsed}" is not supported.`));
		};
		return indicator;
	};
};
