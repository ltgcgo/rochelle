// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* Read text from raw byte streams. Filling in for the gaping hole of JavaScript, where reading text by lines is present everywhere else.
* @module
*/

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
	 * @param stream The incoming raw byte stream.
	 * @param splitMode How should the bytes be split.
	 */
	static lineRaw(stream: ReadableStream, splitMode?: number): ReadableStream<Uint8Array>;
	/**
	 * Read each line as decoded string.
	 * @param stream The incoming raw byte stream.
	 * @param label The text encoding label of the incoming raw stream.
	 */
	static line(stream: ReadableStream, label?: string): ReadableStream<string>;
}
