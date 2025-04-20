"use strict";

import {
	$e
} from "../../libs/lightfelt@ltgcgo/main/quickPath";
import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {
	fileOpen
} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

import TextReader from "../textRead/index.mjs";

const buttonFetch = $e("button#doFetch");
const buttonOpen = $e("button#doOpen");
const inputUrl = $e("input#fetchUrl");
const textRenderer = $e("div#textRenderer");

const propsFile = JSON.parse(`{"id":"cc.ltgc.rochelle.plainText","description":"Open a plain text file."}`);
let urlLoader;

const createP = (text, classes) => {
	let e = document.createElement("p");
	e.appendChild(document.createTextNode(text));
	if (classes?.length > 0) {
		for (let className of classes) {
			e.classList.on(className);
		};
	};
	return e;
};
const loadStream = async (stream) => {
	while (textRenderer.children.length > 0) {
		textRenderer.children[0].remove();
	};
	try {
		console.info(`Decoding started.`);
		for await (let line of TextReader.chunk(stream)) {
			console.debug(line);
			textRenderer.appendChild(createP(`Decoded bytes: ${line.length}\n${line.substring(0, 512)}${line.length > 512 ? " ..." : ""}`, ['verbose-text']));
		};
	} catch (err) {
		textRenderer.appendChild(createP(`${err}\n\t${err.stack.replaceAll("\n", "\n\t")}`, ['has-text-danger', 'verbose-text']));
		console.error(err);
	};
};
const openUrl = async () => {
	clearTimeout(urlLoader);
	while (textRenderer.children.length > 0) {
		textRenderer.children[0].remove();
	};
	let targetUrl = inputUrl.value;
	textRenderer.appendChild(createP(`Downloading from: ${targetUrl}`, ['has-text-info']));
	try {
		let resp = await fetch(targetUrl);
		await loadStream(resp.body);
		textRenderer.appendChild(createP(`Text loaded from remote: ${targetUrl}`, ['has-text-success']));
	} catch (err) {
		textRenderer.appendChild(createP(`${err}\n\t${err.stack.replaceAll("\n", "\n\t")}`, ['has-text-danger', 'verbose-text']));
		console.error(err);
	};
};
const openFile = async () => {
	clearTimeout(urlLoader);
	try {
		let fileBlob = await fileOpen(propsFile);
		await loadStream(await fileBlob.stream());
		textRenderer.appendChild(createP(`Text loaded from disk: ${fileBlob.name}`, ['has-text-success']));
	} catch (err) {
		textRenderer.appendChild(createP(`${err}\n\t${err.stack.replaceAll("\n", "\n\t")}`, ['has-text-danger', 'verbose-text']));
		console.error(err);
	};
};

urlLoader = setTimeout(openUrl, 3000);
buttonFetch.addEventListener("mouseup", openUrl);
buttonOpen.addEventListener("mouseup", openFile);
