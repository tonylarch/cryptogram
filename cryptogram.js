let startTime, solvedTime;

function makeKey(keyString) {
	let ret = new Map();
	for (const [i, c] of Object.entries(keyString)) {
		ret.set(c, uppercase[i]);
	}
	return ret;
}

function makeReverseKey(keyString) {
	let ret = new Map();
	for (const [i, c] of Object.entries(uppercase)) {
		ret.set(c, keyString[i]);
	}
	return ret;
}

class Puzzle {
	cipher;		// the ciphertext
	keyString;  // the original key string
	key;		// a map from cipher to plain
	attempt;	// a partial map from cipher to plain
	mapped;		// set of the values from attempt

	constructor(cipher, keyString) {
		this.cipher = cipher;
		this.keyString = keyString;
		this.key = makeKey(keyString);
		this.attempt = new Map();
		this.mapped = new Set();
		this.me = this;
	}

	setAttempt(cipherChar, plainChar) {
		let me = this.me;
		me.attempt.set(cipherChar, plainChar);
		me.mapped.add(plainChar);
	}

	removeAttempt(cipherChar) {
		let me = this.me;
		let plain = me.attempt.get(cipherChar);
		me.attempt.delete(cipherChar);

		if (plain !== undefined) {
			me.mapped.delete(plain);
		}
	}

	removeAllAttempts() {
		let me = this.me;
		me.attempt = new Map();
		me.mapped = new Set();
	}

	getUnused() {
		let ret = "";
		for (const c of uppercase) {
			if (!this.me.mapped.has(c)) {
				ret += c;
			}
		}
		return ret;
	}

	isSolved() {
		let me = this.me;

		for (const c of me.cipher) {
			if (me.attempt.get(c) != me.key.get(c)) {
				return false;
			}
		}

		return true;
	}
}

let selectedCipherChar;

function makeClickHandler(puzzle) {
	return (ev) => {
		let letter = ev.currentTarget.closest(".letter");
		selectedCipherChar = letter.querySelector(".cipher").innerText;
		updateDisplay(puzzle);
	}
}

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
		if (solvedTime === undefined) {
			solvedTime = new Date();
		}
		let elapsed = solvedTime - startTime;
		let delta = formatDelta(elapsed);
		document.getElementById("time").innerText = delta;
		document.getElementById("solved").showModal();
		navigator.clipboard.writeText(`Puzzle solved in ${delta}`);
	}
}

function displayPuzzle(puzzle) {
	let container = document.getElementById("puzzle_container");
	let ncTempl = document.getElementById("non_coded_letter_template");
	let template = document.getElementById("letter_template");

	function newWord() {
		let ret = document.createElement("div");
		ret.classList.add("word");
		return ret;
	}

	let currentWord = newWord();

	for (const c of puzzle.cipher) {
		let templ = template.content.cloneNode(true);
		let cipherNode = templ.querySelector(".cipher");
		let plainNode = templ.querySelector(".plain");
		let letter = templ.querySelector(".letter");

		if (uppercaseSet.has(c)) {
			cipherNode.innerText = c;

			// There won't actually be any attempts right at the start.
			let plainNode = templ.querySelector(".plain");
			if (puzzle.attempt.has(c)) {
				plainNode.innerText = puzzle.attempt.get(c);
			} else {
				plainNode.innerText = '\u00A0';
			}
			letter.addEventListener("click", makeClickHandler(puzzle));
		} else {
			cipherNode.innerText = '\u00A0';
			plainNode.innerText = c;
			letter.classList.add("non_coding");
			if (c == " ") {
				container.append(currentWord);
				currentWord = newWord();
			}
		}
		currentWord.append(templ);
		container.append(templ);
	}
	container.append(currentWord);

	document.addEventListener("keyup", (ev) => {
		keyHandler(puzzle, ev.key);
	});
	document.getElementById("unused").innerText = puzzle.getUnused();
}

function updateDisplay(puzzle) {
	let container = document.getElementById("puzzle_container");
	let letters = container.querySelectorAll(".letter");
	let seen = new Map();

	letters.forEach((node) => {
		if (node.classList.contains("non_coding")) {
			return;
		}
		let cipherNode = node.querySelector(".cipher");
		if (cipherNode === null) {
			return;
		}
		let cipher = cipherNode.innerText;
		let plain = puzzle.attempt.get(cipher);

		let plainNode = node.querySelector(".plain");
		plainNode.classList.remove("conflicted");

		if (cipher == selectedCipherChar) {
			node.classList.add("current");
		} else {
			node.classList.remove("current");
		}

		if (plain !== undefined) {
			existing = seen.get(plain);
			if (existing !== undefined && existing != cipher) {
				plainNode.classList.add("conflicted");
			}
			seen.set(plain, cipher);
			plainNode.innerText = plain;
		} else {
			plainNode.innerText = '\u00A0';
		}
	});

	document.getElementById("unused").innerText = puzzle.getUnused();
}

function createPuzzle(text) {
	let letters = [...uppercase];

	for (let i = letters.length-1; i > 0; i--) {
		const j = Math.floor(Math.random()*(i+1));
		[letters[i], letters[j]] = [letters[j], letters[i]];
	}

	let ret = letters.join("");
	let key = makeReverseKey(ret);
	text = text.replace(/\s+/g, " ");
	text = text.toUpperCase();

	for (const c of text) {
		if (uppercaseSet.has(c)) {
			ret += key.get(c);
		} else {
			if (encodeLetter(c) === undefined) {
				continue;
			}
			ret += c;
		}
	}
	return ret
}

function setupCreate() {
	let newPuzz = document.getElementById("open_create");

	newPuzz.addEventListener("click", (e) => {
		document.getElementById("create_puzzle").showModal();
	});

	let puzzDialog = document.getElementById("create_puzzle");

	puzzDialog.addEventListener("keyup", (e) => {
		console.log("keyup");
		e.stopPropagation();
	});

	let createText = document.getElementById("create_text");
	createText.addEventListener("keydown", (e) => {
		switch (e.key) {
		case "Backspace":
		case "Delete":
			break;
		case "Enter":
			e.preventDefault();
		default:
			c = e.key.toUpperCase();
			if (encodeLetter(c) === undefined) {
				e.preventDefault();
			}
		}
	});

	let create = document.getElementById("create");
	create.addEventListener("click", (e) => {
		let text = createText.innerText;
		let url = window.location.href.split('?')[0]
			+ "?" + packString(createPuzzle(text))
		navigator.clipboard.writeText(url);

		let link = document.createElement("a");
		link.href = url;
		link.textContent = url;
		link.target = "_blank";
		link.rel = "noopener";

		document.getElementById("url").append(link);
		document.getElementById("created").classList.remove("hidden");
	});

	document.getElementById("reset_create").addEventListener("click", (e) => {
		document.getElementById("create_text").innerText = null;
		document.getElementById("url").innerText = null;
		document.getElementById("created").classList.add("hidden");
	});

	document.getElementById("close_create").addEventListener("click", (e) => {
		puzzDialog.close();
	});
}

function setupSuccess() {
	let success = document.getElementById("solved");
	let close = document.getElementById("close_success");
	close.addEventListener("click", (e) => {
		success.close();
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
	setupCreate();
	setupSuccess();

	let data = unpackString(window.location.search.slice(1));
	let keyString = data.slice(0, 26);
	let cipher = data.slice(26);

	let p = new Puzzle(cipher, keyString);
	displayPuzzle(p);
	setupButtons(p);
	setupKeyboard(p);
	startTime = new Date();
}

window.onload = main;
