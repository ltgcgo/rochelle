// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

/**
 * Obtaining basic information regarding supported text encodings.
 * @module
 */

export default class TextEncoding {
	static readonly BYTE_1: number;
	static readonly BYTE_1_VL: number;
	static readonly BYTE_2_LE: number;
	static readonly BYTE_2_BE: number;
	static readonly BYTE_3_LE: number;
	static readonly BYTE_3_BE: number;
	static readonly BYTE_4_LE: number;
	static readonly BYTE_4_BE: number;
	/*
	* Return the unit byte length from the given indicator.
	* @param indicator The encoding indicator.
	*/
	static getUnitSize(indicator: number): number;
	/*
	* Return if the given indicator indicates a big-endian byte order.
	* @param indicator The encoding indicator.
	*/
	static isBigEndian(indicator: number): boolean;
	/*
	* Collapses a text encoding label into a common one.
	* @param label The label to get collapsed.
	*/
	static collapse(label: string): string;
	/*
	* Gets the encoding indicator of a collapsed label.
	* @param collapsed The collapsed label.
	*/
	static indicator(collapsed: string): number;
}
