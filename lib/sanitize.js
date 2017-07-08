const { Transform } = require('stream');
const fs = require('fs');
const aliases = require('../config/aliases.json');

const wildcards = extractWildcards(aliases);
const ignore = loadIgnoreList();

class Sanitize extends Transform {
	constructor(minLen) {
		super({ objectMode: true });
		this.minLen = minLen;
	}

	_transform(data, _, callback) {
		const { word } = data;
		data.orig = word;
		data.word = this.transformWord(word);
		if (data.word.length >= this.minLen) {
			this.push(data);
		}
		callback();
	}

	transformWord(word) {
		if (ignore[word]) return '';
		if (word in aliases) {
			return aliases[word];
		}
		for (const pref in wildcards) {
			if (word.indexOf(pref) === 0) {
				return wildcards[pref];
			}
		}
		if (!word.endsWith('s')) {
			return word;
		}
		// Try to make singular
		const sing = word.slice(0, -1);
		return this.transformWord(sing);
	}
}

function loadIgnoreList() {
	const map = {};
	fs.readFileSync('config/ignore.txt', 'utf8')
	.split(/\r?\n/)
	.forEach((word) => {
		map[word] = true;
	});
	return map;
}

function extractWildcards(map) {
	const wild = {};
	for (const key in map) {
		const val = map[key];
		if (key.slice(-1) === '*') {
			wild[key.slice(0, -1)] = val;
			delete map[key];
		} else {
			// Link aliases back to themselves to ensure they remain
			map[val] = val;
		}
	}
	return wild;
}

module.exports = Sanitize;
