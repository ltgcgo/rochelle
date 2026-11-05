// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import collapsedFromLabels from "../data/generated/collapsedLabels.json" with {type: "json"};
import sstObject from "../data/generated/encodingExtras.json" with {type: "json"};

if (false) {
	for (const rawLabel in sstObject.whatwg) {
		console.info(`${sstObject.whatwg[rawLabel] ? "Yes" : "No"}\t${["Fallback","Replacement","Required"][sstObject.whatwg[rawLabel] ? (sstObject.sst[collapsedFromLabels[rawLabel]]) : 0]}\t${rawLabel}\t${collapsedFromLabels[rawLabel]}`);
	};
};

for (const rawLabel in sstObject.whatwg) {
	try {
		new TextDecoder(rawLabel, {
			"fatal": true
		});
		console.info(`native`);
	} catch (err) {
		console.error(`unsupported`);
	};
};