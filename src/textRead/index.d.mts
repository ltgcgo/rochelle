// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

/**
 * A class exposing static methods to read text streams on a line-by-line basis.
 * ```js
 * for await (let line of TextReader.line(someReadableStream)) {
 * 	console.log(line);
 * };
 * ```
 */
export default class TextReader {
	/**
	 * Read each line as raw bytes.
	 */
	static lineRaw(stream: ReadableStream, splitMode?: number): ReadableStream<Uint8Array>;
	/**
	 * Read each line as decoded string.
	 */
	static line(stream: ReadableStream, splitMode?: number, label?: string): ReadableStream<string>;
}
