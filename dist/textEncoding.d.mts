// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/** Obtain basic information regarding supported text encodings.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.textEncoding */

export default class TextEncoding {
	static readonly BYTE_1: 0;
	static readonly BYTE_1_VL: 1;
	static readonly BYTE_2_LE: 2;
	static readonly BYTE_2_BE: 3;
	static readonly BYTE_3_LE: 4;
	static readonly BYTE_3_BE: 5;
	static readonly BYTE_4_LE: 6;
	static readonly BYTE_4_BE: 7;
	/** Return the unit byte length from the given indicator.
	* @param indicator The encoding indicator. */
	static getUnitSize(indicator: number): number;
	/** Return if the given indicator indicates a big-endian byte order.
	* @param indicator The encoding indicator. */
	static isBigEndian(indicator: number): boolean;
	/** Collapses a text encoding label into a common one.
	* @param label The label to get collapsed. */
	static collapse(label: string): string;
	/** Gets the encoding indicator of a collapsed label.
	* @param collapsed The collapsed label. */
	static indicator(collapsed: string): number;
	/** Returns if a label is defined in the WHATWG encoding standard.
	* @param label The label to be tested. */
	static isWHATWG(label: string): number;
	/** Gets the expected software support type of a collapsed label.
	* @param collapsed The collapsed label. */
	static sst(collapsed: string): number;
	/** Gets a numeric ID from the provided text encoding label. Useful for single-pass switch optimisations.
	*
	* Numeric IDs are **NOT** guaranteed to be the same across versions! */
	static toId(label: string): number;
	/** Gets a text encoding label from the provided numeric ID. */
	static fromId(encodingId: number): string;
}
