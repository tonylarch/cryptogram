function randomKeyString() {
	let letters = [...uppercase];

	for (let i = letters.length-1; i > 0; i--) {
		const j = Math.floor(Math.random()*(i+1));
		[letters[i], letters[j]] = [letters[j], letters[i]];
	}

	return letters.join("");
}

function sanitizeText(text) {
	let ret = "";

	text = text.replace(/\s+/g, " ");
	text = text.toUpperCase();

	for (const c of text) {
		if (encodeLetter(c) === undefined) {
			continue;
		}
		ret += c;
	}
	return ret;
}

function setupInput(puzzle) {
	let editor = document.getElementById("create_text");
	editor.addEventListener("input", (e) => {
		let text = sanitizeText(editor.innerText);
		puzzle.cipher = puzzle.encrypt(text);
		displayPuzzle(puzzle);
	});
}

function makeUrl(puzzle) {
	let data = packString(puzzle.keyString + puzzle.cipher);
	let url = window.location.href.split('?')[0] + "?" + data;
	url = url.replace(/create/, "index");
	if (puzzle.isEmojified) {
		url += "~";
	}
	return url;
}

function resetKey(puzzle) {
	let key = randomKeyString();
	puzzle.resetKey(key);
	puzzle.attempt = puzzle.key;
}

function main() {
	initPack();
	initEmojis();

	let puzzle = new Puzzle("", randomKeyString());
	puzzle.attempt = puzzle.key;
	setupInput(puzzle);

	let use_emojis = document.getElementById("use_emojis");
	puzzle.isEmojified = use_emojis.checked;
	use_emojis.addEventListener("change", (e) => {
		puzzle.isEmojified = e.target.checked;
		displayPuzzle(puzzle);
	});

	let finishedDialog = document.getElementById("finished");
	document.getElementById("done").addEventListener("click", (e) => {
		let url = makeUrl(puzzle);
		let link = document.createElement("a");

		link.href = url;
		link.textContent = url;
		link.target = "_blank";
		link.rel = "noopener";
		navigator.clipboard.writeText(`CAN YOU SOLVE THE ${banner}?\n\n${url}`);
		document.getElementById("url").replaceChildren(link);
		finishedDialog.showModal();
	});

	document.getElementById("reset").addEventListener("click", (e) => {
		document.getElementById("create_text").replaceChildren();
		resetKey(puzzle);
		displayPuzzle(puzzle);
	});

	document.getElementById("close").addEventListener("click", (e) => {
		finishedDialog.close();
	});
}

window.onload = main;
