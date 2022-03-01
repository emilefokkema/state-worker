const path = require('path');

module.exports = {
	entry: './src/node/state-worker-child-script.js',
	output: {
		filename: 'child-process.js',
		path: path.resolve(__dirname, 'dist')
	},
	externals: {
		'./req': 'commonjs-module ./req',
		worker_threads: 'commonjs-module worker_threads',
	},
	devtool: false,
	mode: 'production'
}