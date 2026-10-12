// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

const bufferCarve = function (buffer, carvedList = []) {
	if (carvedList?.length > 0) {
		const filteredBuffer = new Uint8Array(buffer.length - carvedList.length);
		for (let i = 0; i < carvedList.length; i ++) {
			const e0 = i === 0 ? 0 : carvedList[i - 1] + 1;
			const e1 = carvedList[i];
			if (e1 - e0 > 1) {
				filteredBuffer.set(buffer.subarray(e0, e1), e0 - i);
			};
		};
		const lastKnockout = carvedList[carvedList.length - 1];
		filteredBuffer.set(buffer.subarray(lastKnockout + 1), lastKnockout - carvedList.length + 1);
		return filteredBuffer;
	} else {
		return buffer;
	}
};

export {
	bufferCarve
}