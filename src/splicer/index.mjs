// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

const StreamQueue = class StreamQueue {
	#controller;
	#pullPromise;
	#pullResolve;
	#pullReject;
	#closedResolve;
	#isBusy = false;
	#isImmediateRefresh = false;
	#immediatePromise = Promise.resolve();
	debugMode = false;
	closed = false;
	closure;
	cancelled;
	readable;
	get ready() {
		if (this.#isImmediateRefresh || this.closed || this.#isBusy) {
			return this.#pullPromise;
		} else {
			return this.#immediatePromise;
		};
	};
	constructor(underlyingSource = {}, queuingStrategy) {
		let upThis = this;
		let cancelledResolve;
		upThis.cancelled = new Promise((p) => {
			cancelledResolve = p;
		});
		WritableStreamDefaultWriter.prototype
		upThis.closure = new Promise((p) => {
			upThis.#closedResolve = p;
		})
		upThis.readable = new ReadableStream({
			"type": underlyingSource?.type,
			"autoAllocateChunkSize": underlyingSource?.autoAllocateChunkSize,
			"cancel": async (reason) => {
				upThis.#pullReject(reason);
				cancelledResolve(reason);
				upThis.#closedResolve();
				upThis.closed = true;
				underlyingSource?.cancelled?.call(upThis, reason);
				upThis.debugMode && console.debug(`Stream cancel.`);
			},
			"start": async (controller) => {
				upThis.#controller = controller;
				upThis.debugMode && console.debug(`Stream start.`);
				underlyingSource?.start?.call(upThis, new Proxy(controller, {
					"get": (target, key) => {
						switch (key) {
							case "enqueue":
							case "error":
							case "close": {
								return upThis[key];
								break;
							};
							default: {
								return target[key];
							};
						};
					}
				}));
				upThis.debugMode && console.debug(`Source start called.`);
				upThis.#pullPromise = new Promise((p, r) => {
					upThis.#pullResolve = p;
					upThis.#pullReject = r;
				});
			},
			"pull": async (controller) => {
				upThis.#isBusy = false;
				upThis.#pullResolve();
				upThis.#pullPromise = new Promise((p, r) => {
					upThis.#pullResolve = p;
					upThis.#pullReject = r;
				});
				upThis.debugMode && console.debug(`Stream pull.`);
			}
		}, queuingStrategy);
	};
	async enqueue(chunk) {
		let upThis = this;
		if (upThis.closed) {
			throw(new Error("The stream is closed."));
		};
		if (upThis.#isBusy === false) {
			upThis.#isBusy = true;
			/*if (upThis.#isLazy) {
				upThis.#pullPromise = new Promise((p, r) => {
					upThis.#pullResolve = p;
					upThis.#pullReject = r;
				});
			};*/
		};
		upThis.#controller.enqueue(chunk);
		return await upThis.#pullPromise;
	};
	close() {
		let upThis = this;
		if (upThis.closed) {
			console.debug("The stream has already been closed.");
			return;
		};
		upThis.#controller.close();
		upThis.#closedResolve();
		upThis.closed = true;
	};
	error(err) {
		let upThis = this;
		if (upThis.closed) {
			console.debug("The stream has already been closed.");
			return;
		};
		upThis.#controller.error(err);
		upThis.#closedResolve();
		upThis.closed = true;
	};
	pipeFrom(source) {
		(async () => {
			for await (let chunk of source) {
				await this.enqueue(chunk);
			};
		})();
	};
};
const StreamServe = class StreamServe {};
const ChokerStream = class ChokerStream {};

export {
	StreamQueue,
	StreamServe,
	ChokerStream
};
