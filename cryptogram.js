/*
 * Copyright (c) 2026 Tony Larch
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
let startTime, solvedTime;

function formatDelta(t) {
	function fmt(v) {
		return String(v).padStart(2, '0');
	}
	let ret = "";
	let seconds = Math.floor(t / 1000);
	let hours = Math.floor(seconds / 3600);
	if (hours != 0) {
		ret = fmt(hours) + ":";
	}
	seconds -= hours * 3600;
	let minutes = Math.floor(seconds / 60);
	ret += fmt(minutes) + ":";
	seconds -= minutes * 60;
	ret += fmt(seconds);
	return ret;
}

function keyHandler(puzzle, key) {
	if (document.querySelector("dialog[open]") !== null) {
		return;
	}

	switch (key) {
	case "Backspace":
		puzzle.removeAttempt(selectedCipherChar);
		break;
	case "Delete":
		puzzle.removeAttempt(selectedCipherChar);
		break;
	case "Escape":
		selectedCipherChar = undefined;
		puzzle.removeAllAttempts();
		break;
	default:
		{
			if (selectedCipherChar === undefined) {
				return;
			}
			let val = key.toUpperCase();
			if (!uppercaseSet.has(val)) {
				return;
			}
			puzzle.setAttempt(selectedCipherChar, val);
		}
	}
	updateDisplay(puzzle);

	if (puzzle.isSolved()) {
		puzzle.solveTimer.stop();
		if (solvedTime === undefined) {
			solvedTime = new Date();
		}
		let elapsed = solvedTime - startTime;
		let delta = formatDelta(elapsed);
		let solveTime = formatDelta(puzzle.solveTimer.recorded);

		document.getElementById("total_elapsed").innerText = delta;
		document.getElementById("solve_time").innerText = solveTime;
		document.getElementById("solved").showModal();
		navigator.clipboard.writeText(`I SOLVED THE ${banner}!
Puzzle solved in ${solveTime} (total elapsed ${delta})`);
	}
}

function setupSuccess() {
	let success = document.getElementById("solved");
	let close = document.getElementById("close_success");
	close.addEventListener("click", (e) => {
		success.close();
	});
}

function setupDialog(name, fn) {
	let dialog = document.getElementById(`${name}_dialog`);
	let open = document.getElementById(name);
	let close = document.getElementById(`close_${name}`);

	open.addEventListener("click", (e) => {
		if (fn !== null) {
			fn(e);
		}
		dialog.showModal();
	});

	close.addEventListener("click", (e) => {
		dialog.close();
	});
}

function setupButtons(puzzle) {
	document.getElementById("delete").addEventListener("click", (e) => {
		puzzle.removeAttempt(selectedCipherChar);
		updateDisplay(puzzle);
	});
	document.getElementById("reset").addEventListener("click", (e) => {
		puzzle.removeAllAttempts();
		selectedCipherChar = undefined;
		updateDisplay(puzzle);
	});

	setupDialog("share", (e) => {
		let url = window.location.href;
		let link = document.createElement("a");

		link.href = url;
		link.textContent = url;
		link.target = "_blank";
		link.rel = "noopener";
		navigator.clipboard.writeText(`CAN YOU SOLVE THE ${banner}?\n\n${url}
#emojigram`);
		document.getElementById("url").replaceChildren(link);
	});

	setupDialog("help", (e) => {
		if (puzzle.isEmojified) {
			return;
		}
		let el = document.querySelector("#help_dialog .msg");
		let text = el.innerText;
		text = text.replace(/emoji/, "cipher letter");
		el.innerText = text;
	});
}

function setupKeyboard(puzzle) {
	document.querySelectorAll("span.kb_letter").forEach((node) => {
		node.addEventListener("click", (e) => {
			let key = e.target.innerText;
			keyHandler(puzzle, key);
		});
	});
}

function main() {
	initPack();
	initEmojis();
	setupSuccess();

	let useEmojis = false;
	let data = window.location.search.slice(1);

	if (data.at(-1) == "~") {
		data = data.slice(0, -1);
		useEmojis = true;
	}
	data = unpackString(data);

	let keyString = data.slice(0, 26);
	let cipher = data.slice(26);

	let puzzle = new Puzzle(cipher, keyString);
	if (useEmojis) {
		puzzle.isEmojified = true;
	}
	displayPuzzle(puzzle);

	document.addEventListener("keyup", (ev) => {
		keyHandler(puzzle, ev.key);
	});

	setupButtons(puzzle);
	setupKeyboard(puzzle);
	startTime = new Date();
}

window.onload = main;
