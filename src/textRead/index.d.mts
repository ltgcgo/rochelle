// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

export default class TextReader {
	static lineRaw(stream: ReadableStream, splitMode: number): ReadableStream<Uint8Array>;
	static line(stream: ReadableStream, splitMode: number, label: string): ReadableStream<string>;
}
