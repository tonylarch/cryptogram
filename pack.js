const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let uppercaseSet = new Set();
let punctuationCoding, reversePunctuationCoding;

function initPack() {
	for (const c of uppercase) {
		uppercaseSet.add(c);
	}

	punctuationCoding = new Map();
	reversePunctuationCoding = new Map();

	let i = 27;
	for (const c of " .,-\"'?!<>;:()") {
		punctuationCoding.set(c, i);
		reversePunctuationCoding.set(i, c);
		i++;
	}
}

function encodeLetter(c) {
	/*
	 * We encode 'A' as 1, so that 0 can be used for padding (the thing you're
	 * decoding is a multiple of 8 bits, so there may be >6 left over)
	 */
	if (uppercaseSet.has(c)) {
		return c.charCodeAt(0) - 64;
	}

	let ret = punctuationCoding.get(c);
	if (ret !== undefined) {
		return ret;
	}

	return undefined;
}

function decodeLetter(code) {
	let c = code + 64;
	if (c >= 65 && c <= 90) {
		return String.fromCodePoint(c);
	}

	return reversePunctuationCoding.get(code);
}

function b64encode(array) {
	let s = String.fromCharCode(...array);

	// Switch a few characters and get rid of any padding (the = character is
	// problematic in URLs)
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64decode(s) {
	s = s.replace(/-/g, '+').replace(/_/g, '/');
	while (s.length % 4) {
		s += '=';
	}
	let bs = atob(s);
	let ret = new Uint8Array(bs.length);
	for (i = 0; i < bs.length; i++) {
		ret[i] = bs.charCodeAt(i)
	}
	return ret;
}

function packString(s) {
	const numChars = s.length;
	const numBits = numChars * 6;
	const numBytes = Math.ceil(numBits / 8);
	let ret = new Uint8Array(numBytes);

	let i = 0;	// current byte we're filling in
	let j = 0;	// which bit we've got to in the output

	function incr(n) {
		j += n;
		if (j >= 8) {
			i++;
			j -= 8;
		}
	}

	function putBits(n, val) {
		// put n bits into the current byte
		let mask = (1<<n) - 1
		ret[i] |= (val & mask) << j
		incr(n);
	}

	for (let c of s) {
		const val = encodeLetter(c);	// get the next 6-bit value
		const avail = 8 - j;

		if (avail >= 6) {
			putBits(6, val);
			continue;
		}

		// Put what we can into the current byte.
		putBits(avail, val);

		// And anything left-over into the next one.
		let remaining = 6 - avail;
		if (remaining > 0) {
			putBits(remaining, val >> avail);
		}
	}

	return b64encode(ret);
}

function unpackString(s) {
	let array = b64decode(s);
	let ret = "";
	let i = 0, j = 0;

	function incr(n) {
		j += n;
		if (j >= 8) {
			i++;
			j -= 8;
		}
	}

	function getBits(n) {
		// Get the next n bits from the current byte
		const mask = (1<<n) - 1;
		const ret = (array[i] >> j) & mask;
		incr(n);
		return ret;
	}

	function getCode() {
		const avail = 8 - j;
		if (avail >= 6) {
			return getBits(6);
		}

		let ret = getBits(avail);
		ret |= getBits(6-avail) << avail;
		return ret
	}

	const numBits = array.length * 8;
	const numCodes = Math.floor(numBits / 6);

	for (let i = 0; i < numCodes; i++) {
		const code = getCode();
		if (code == 0) break;
		const c = decodeLetter(code);
		ret += c;
	}

	return ret;
}
