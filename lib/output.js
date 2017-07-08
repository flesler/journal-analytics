const { Transform } = require('stream');

const SEPARATOR = '\t';
const FIXED_COLS = ['word', 'total'];

class Output extends Transform {
	constructor(maxRows) {
		super({ writableObjectMode: true });
		this.maxRows = maxRows;
		this.written = 0;
		this.dup = {};
	}

	_transform(row, _, callback) {
		if (!this.keys) {
			this.keys = this.getKeys(row);
			this.push(this.keys.join(SEPARATOR));
			this.push('\n');
		}
		if (this.written < this.maxRows) {
			this.outputRow(row);
		}
		callback();
	}

	getKeys(row) {
		return FIXED_COLS.concat(
			Object.keys(row)
			.sort()
			.filter(key => !FIXED_COLS.includes(key))
		);
	}

	outputRow(row) {
		const word = row.word;
		if (word in this.dup) {
			throw new Error('The word "' + word + '" appears +1');
		}
		this.dup[word] = true;

		this.keys.forEach((key, i) => {
			if (i) this.push(SEPARATOR);
			this.push(row[key] + '');
		}, this);
		this.push('\n');
		this.written += 1;
	}
}

module.exports = Output;
