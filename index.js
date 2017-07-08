const Words = require('./lib/words');
const Sanitize = require('./lib/sanitize');
const Aggregator = require('./lib/aggregator');
const Output = require('./lib/output');
const opts = require('commander');
const version = require('./package.json').version;

opts
  .version(version)
	.option('-b, --by <period>', 'How to group score (month, year, "" for total)', String, '')
	.option('-m, --min-len <n>', 'Ignore words shorter than n', Number, 4)
	.option('-M, --max-rows <n>', 'How many rows to output at most', Number, 500)
	.option('-f, --min-found <n>', 'Ignore words that were found less than n', Number, 0)
	.parse(process.argv);

process.stdin
	.pipe(new Words())
	.pipe(new Sanitize(opts.minLen))
	.pipe(new Aggregator(opts.by, opts.minFound))
	.pipe(new Output(opts.maxRows))
	.pipe(process.stdout)
	;

// Ignore EPIPE's, f.e if this is piped to `tail`
process.on('uncaughtException', (err) => {
	if (err.message.includes('EPIPE')) {
		process.exit();
	}
	throw err;
});
