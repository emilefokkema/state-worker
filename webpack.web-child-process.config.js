const path = require('path');

module.exports = {
	entry: './src/web/state-worker-child-script.js',
	output: {
		filename: 'web-child-process.js',
		path: path.resolve(__dirname, 'dist')
	},
	devtool: false,
	mode: 'production'
}