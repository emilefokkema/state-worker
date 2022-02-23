const path = require('path');

module.exports = {
	entry: './test/run-web-tests.js',
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'test/web-test')
	},
	mode: 'development'
}