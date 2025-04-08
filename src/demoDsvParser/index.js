"use strict";

import {
	$e
} from "../../libs/lightfelt@ltgcgo/main/quickPath";
import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {
	fileOpen
} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

import TextReader from "../textRead/index.mjs";
import DsvParser from "../dsvParse/index.mjs";

const buttonFetch = $e("button#doFetch");
const buttonOpen = $e("button#doOpen");
const inputUrl = $e("input#fetchUrl");
const tableRenderer = $e("div#tableRenderer");

const propsFile = JSON.parse(`{"id":"cc.ltgc.rochelle.plainText","description":"Open a plain text file."}`);
let urlLoader;

const newElement = (tag, children, classes) => {
	let e = document.createElement(tag);
	if (children?.length > 0) {
		for (let child of children) {
			e.append(child);
		};
	};
	if (classes?.length > 0) {
		for (let className of classes) {
			e.classList.on(className);
		};
	};
	return e;
};
const loadStream = async (stream, type) => {
	while (tableRenderer.children.length > 0) {
		tableRenderer.children[0].remove();
	};
	let tableHead = newElement("thead");
	let tableBody = newElement("tbody");
	tableRenderer.append(newElement("div", [
		newElement("table", [tableHead, tableBody], ["table", "is-striped"])
	], ["table-container"]));
	try {
		let lineNo = 0;
		for await (let line of DsvParser.parse(type | DsvParser.DATA_TEXT, TextReader.line(stream))) {
			let tableLine = newElement("tr");
			if (lineNo === 0) {
				tableHead.append(tableLine);
				for (let cell of line) {
					tableLine.append(newElement("th", [cell]));
				};
			} else {
				tableBody.append(tableLine);
				for (let cell of line) {
					tableLine.append(newElement("td", [cell]));
				};
			};
			lineNo ++;
		};
	} catch (err) {
		tableRenderer.appendChild(newElement("p", [`${err}\n\t${err.stack.replaceAll("\n", "\n\t")}`], ['has-text-danger', 'verbose-text']));
		console.error(err);
	};
};
const openUrl = async () => {
	clearTimeout(urlLoader);
	while (tableRenderer.children.length > 0) {
		tableRenderer.children[0].remove();
	};
	let targetUrl = inputUrl.value;
	tableRenderer.appendChild(newElement("p", `Downloading from: ${targetUrl}`, ['has-text-info']));
	try {
		let resp = await fetch(targetUrl);
		await loadStream(resp.body, targetUrl.toLowerCase().substring(targetUrl.length - 4) === ".tsv" ? DsvParser.TYPE_TSV : DsvParser.TYPE_CSV);
		tableRenderer.appendChild(newElement("p", `DSV loaded from remote: ${targetUrl}`, ['has-text-success']));
	} catch (err) {
		tableRenderer.appendChild(newElement("p", [`${err}\n\t${err.stack.replaceAll("\n", "\n\t")}`], ['has-text-danger', 'verbose-text']));
		console.error(err);
	};
};
const openFile = async () => {
	clearTimeout(urlLoader);
	try {
		let fileBlob = await fileOpen(propsFile);
		await loadStream(await fileBlob.stream(), fileBlob.name.toLowerCase().substring(targetUrl.length - 4) === ".tsv" ? DsvParser.TYPE_TSV : DsvParser.TYPE_CSV);
		tableRenderer.appendChild(newElement("p", `DSV loaded from disk: ${fileBlob.name}`, ['has-text-success']));
	} catch (err) {
		tableRenderer.appendChild(newElement("p", [`${err}\n\t${err.stack.replaceAll("\n", "\n\t")}`], ['has-text-danger', 'verbose-text']));
		console.error(err);
	};
};

urlLoader = setTimeout(openUrl, 3000);
buttonFetch.addEventListener("mouseup", openUrl);
buttonOpen.addEventListener("mouseup", openFile);
