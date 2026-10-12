// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

const minMemMiB = 64;

const getFreeMemMiB = () => {
	if (typeof globalThis.Deno?.systemMemoryInfo === "function") {
		if (Deno.permissions.querySync({
			"name": "sys",
			"kind": "systemMemoryInfo"
		}).state === "granted") {
			return Math.max(minMemMiB, Math.floor(Deno.systemMemoryInfo().available / 1048576));
		} else {
			return minMemMiB;
		};
	} else if (typeof globalThis.process?.availableMemory === "function") {
		return Math.max(minMemMiB, Math.floor(globalThis.process.availableMemory() / 1048576));
	} else if (typeof globalThis.navigator?.deviceMemory === "number") {
		return Math.max(minMemMiB, globalThis.navigator.deviceMemory * 1024);
	} else {
		return minMemMiB;
	};
}

let maxSafeAllocationSize = Math.floor(Math.min(getFreeMemMiB(), 4096) / 16) * 1048576;;
const updateCeiling = () => {
	maxSafeAllocationSize = Math.floor(Math.min(getFreeMemMiB(), 4096) / 16) * 1048576;
};
/** @param {number} desiredSize
* @returns {Uint8Array} */
const allocateU8 = (desiredSize) => {
	if (Number.isSafeInteger(desiredSize)) {
		if (desiredSize < 0) {
			throw(new RangeError(`Invalid range!`));
		} else if (desiredSize > maxSafeAllocationSize) {
			throw(new RangeError(`Desired size too large.`));
		};
		return new Uint8Array(desiredSize);
	} else {
		throw(new RangeError(`Invalid desired size, must be a safe integer.`));
	};
};

export {
	getFreeMemMiB,
	updateCeiling,
	allocateU8
}