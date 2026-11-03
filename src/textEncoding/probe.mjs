// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

import collapsedFromLabels from "../data/generated/collapsedLabels.json" with {type: "json"};

if (false) {
	for (const rawLabel in collapsedFromLabels) {
		console.info(`${rawLabel}\t${collapsedFromLabels[rawLabel]}`);
	};
};

for (const rawLabel in collapsedFromLabels) {
	try {
		new TextDecoder(rawLabel);
		console.info(`native`);
	} catch (err) {
		console.error(`unsupported`);
	};
};