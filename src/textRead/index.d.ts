// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

export default class TextReader {
	static lineRaw(stream: ReadableStream, splitMode: number = 0): ReadableStream<Uint8Array>;
	static line(stream: ReadableStream, splitMode: number = 0, label: string): ReadableStream<string>;
};
