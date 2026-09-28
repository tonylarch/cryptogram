
let emojis = [..."🙂🤬😈🔥😺💚🐛👀🤟🙏🌷🍄🌊🌋🌟🦕🐕🐒🦆🦀🐸🐝🐙🍎🍔🌎"];
let emojiSet = new Set();
let emojiMap = new Map();	// maps emojis back to regular characters

function initEmojis() {
	for (const [i, c] of Object.entries(emojis)) {
		emojiSet.add(c);
		emojiMap.set(c, String.fromCharCode(Number(i)+65));
	}
}

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

class SolveTimer {
	started;	// the time when we last started
	recorded;	// total recorded time

	constructor() {
		this.recorded = 0;
	}

	start() {
		if (this.started !== undefined) {
			// if we're already running do nothing
			return;
		}
		this.started = new Date();
	}

	stop() {
		if (this.started === undefined) {
			// if we're not already running do nothing
			return;
		}
		let now = new Date();
		this.recorded += now - this.started;
		this.started = undefined;
	}
}

class Puzzle {
	cipher;		// the ciphertext
	keyString;  // the original key string
	key;		// a map from cipher to plain
	reverseKey;	// a map from plain to cipher
	attempt;	// a partial map from cipher to plain
	mapped;		// set of the values from attempt
	isEmojified;
	solveTimer;

	constructor(cipher, keyString) {
		this.resetKey(keyString);
		this.cipher = cipher;
		this.attempt = new Map();
		this.mapped = new Set();
		this.solveTimer = new SolveTimer();
		this.me = this;
	}

	resetKey(keyString) {
		/*
		 * Also removes the cipher text, because without a key that it useless,
		 * and going to cause you bigger problems.
		 */
		this.keyString = keyString;
		this.key = makeKey(keyString);
		this.reverseKey = makeReverseKey(keyString);
		this.cipher = "";
	}

	encrypt(plain) {
		let me = this;

		let ret = "";
		for (const p of plain) {
			let c = me.reverseKey.get(p);
			if (c === undefined) {
				ret += p;
			} else {
				ret += c;
			}
		}
		return ret;
	}

	setAttempt(cipherChar, plainChar) {
		let me = this.me;
		me.attempt.set(cipherChar, plainChar);
		me.mapped.add(plainChar);
		this.solveTimer.start();
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
		this.solveTimer.stop()
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

	getDisplayChar(c) {
		let me = this;

		if (me.isEmojified) {
			let index = c.charCodeAt(0) - 65;
			if (index >= 0 && index < 26) {
				return emojis[index];
			}
		}
		return c;
	}

	getCipherChar(displayChar) {
		let me = this;

		if (me.isEmojified) {
			return emojiMap.get(displayChar);
		} else {
			return displayChar
		}
	}

	isCipherChar(c) {
		return uppercaseSet.has(c);
	}
}

let selectedCipherChar;

function makeClickHandler(puzzle) {
	return (ev) => {
		let letter = ev.currentTarget.closest(".letter");
		let displayChar = letter.querySelector(".cipher").innerText;
		selectedCipherChar = puzzle.getCipherChar(displayChar);
		updateDisplay(puzzle);
	}
}

function updateUnused(chars) {
	let unused = document.getElementById("unused");
	if (unused === null) {
		return;
	}
	unused.innerText = chars;
}

function displayPuzzle(puzzle) {
	let container = document.getElementById("puzzle_container");

	// Get rid of any existing puzzle
	container.replaceChildren();

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

		if (puzzle.isCipherChar(c)) {
			cipherNode.innerText = puzzle.getDisplayChar(c);

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
	updateUnused(puzzle.getUnused());
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
		let display = cipherNode.innerText;
		let cipher = puzzle.getCipherChar(display);
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

	updateUnused(puzzle.getUnused());
}
