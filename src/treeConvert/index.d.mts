// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* Modular tree-matching and token-based conversion library.
* Token ID 0 is always used to signal the start of raw untokenized data, while token ID 1 is always used to signal the end of raw untokenized data.
* @module
*/

/** A node on a tree. */
export class TreeNode {
	static TYPE_ROOT: Number;
	static TYPE_BRANCH: Number;
	static TYPE_END: Number;
	/** If the node is root, branch, or end. */
	readonly type: Number;
	/** Actual payload on the tree. For the use of this tokenizing library, it's within the i32 range. */
	data?: Number;
	/** If there are branches, an index of all. */
	branch?: Map<Number,TreeNode>;
}

/** Used to tokenize input buffer streams. */
export class TreeTokenizer {
	/** Import a pre-built encoder tree. */
	use(encoderTree: TreeNode): void;
	/** Decode a buffer stream into a stream of i32 tokens. */
	decode(source: ReadableStream<Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array>): ReadableStream<Int32Array>;
	/** Allows importing a pre-built encoder tree on construction for convenience. */
	constructor(encoderTree: TreeNode);
}

/** Used to detokenize input token streams. */
export class TreeDetokenizer {
	/** Import a pre-built decoder map. */
	use(decoderMap: Map<Number,any>): void;
	/** Decode a stream of i32 tokens into a stream of whatever is provided by the map. */
	decode(source: ReadableStream<Int32Array>): ReadableStream<any>;
	/** Define how should the undecoded section be handled. The function must take in an `Int32Array`. */
	handleRaw(handler: Function): void;
	/** Allows importing a decoder map on construction for convenience. */
	constructor(decoderMap: Map<Number,any>);
}

/** Convenient union representing a codec. */
export class TreeCodec {
	encoder: TreeTokenizer;
	decoder: TreeDetokenizer;
	/** Convert a source stream into a stream of whatever available from the decoder. */
	convert(source: ReadableStream<Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array>): ReadableStream<any>;
	/** Allows setting an encoder and a decoder on construction for convenience. */
	constructor(encoder: TreeTokenizer, decoder: TreeDetokenizer);
}

export interface TreeTokenizerCriteriaRoot {
	path: Iterable<Number>;
	data: Number;
}

export class TreeTokenizerCriteria implements TreeTokenizerCriteriaRoot {
	path: Iterable<Number>;
	data: Number;
	constructor(path: Iterable<Number>, data: Number);
}

/** A pool of registered encoders and decoders. */
export class TreePool {
	encoders: Map<String,TreeTokenizer>;
	decoders: Map<String,TreeDetokenizer>;
	/** Returns a ready-made codec. */
	converter(encKey: String, decKey: String): TreeCodec;
	/** Build a tree from a list for use in encoders. */
	build(encodeList: Iterable<TreeTokenizerCriteria>): TreeNode;
}
