const path = require('path');

module.exports = {
	entry: './src/node-state-worker-child-process.js',
	output: {
		filename: 'child-process.js',
		path: path.resolve(__dirname, 'dist')
	},
	externals: {
		'./req': 'commonjs-module ./req'
	},
	devtool: false,
	mode: 'production'
}