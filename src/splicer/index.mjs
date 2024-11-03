// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

// Asynchronously enqueue readable streams, and combine multiple readable streams together. State of the streams supplying to the queue does not matter.
let StreamQueue = class StreamQueue {};

// Split one readable stream into multiple. State of the subsequent streams do not affect the source stream. Reading from any of the subsequent streams will relieve the backpressure of the source stream.
let StreamServe = class StreamServe {};

// Normalize chunks of a byte stream to a specific size.
// Moved from WingBlade.
let ChokerStream = class ChokerStream {};

export {
	StreamQueue,
	StreamServe,
	ChokerStream
};
