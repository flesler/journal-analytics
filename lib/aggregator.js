const { Transform } = require('stream');
const util = require('./util');

class Aggregator extends Transform {
	constructor(group, minFound) {
		super({ objectMode: true });

		this.group = group;
		this.minFound = minFound;

		this.words = {};
		this.keys = {};
		this.aliases = {};
	}

	_transform(data, _, callback) {
		this.add(data);
		callback();
	}

	_flush(callback) {
		const keys = Object.keys(this.keys);
		this.getRows().forEach((row) => {
			row.word = this.getMostUsedAlias(row.word);
			keys.forEach((key) => {
				row[key] = row[key] || 0;
			});
			this.push(row);
		}, this);
		callback();
	}

	getRows() {
		const { minFound } = this;
		return util.values(this.words)
			.filter(a => a.total >= minFound)
			.sort((a, b) => (
				b.total - a.total
			));
	}

	add(data) {
		const { word, date, orig } = data;

		const row = this.words[word] = (this.words[word] || { word, total: 0 });
		row.total += 1;
		// Count to see which version was the most popular one
		this.aliases[word] = this.aliases[word] || {};
		this.aliases[word][orig] = (this.aliases[word][orig] || 0) + 1;

		if (!this.group) return;
		const key = this.getDate(date);
		row[key] = (row[key] || 0) + 1;
		this.keys[key] = true;
	}

	getDate(date) {
		switch (this.group) {
			case 'month': return date.slice(0, 7);
			case 'year': return date.slice(0, 4);
			default: throw new Error('Invalid --by: ' + this.group);
		}
	}

	getMostUsedAlias(word) {
		const aliases = this.aliases[word];
		const plural = word + 's';
		const baseline = aliases[word] || 0;
		const contender = aliases[plural] || 0;
		// If plural is used more (or always) use it instead
		return contender > baseline ? plural : word;
	}
}

module.exports = Aggregator;
