const path = require('path');

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'state-worker.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'StateWorker',
		libraryTarget: 'umd',
		globalObject: 'this'
	},
	externals: {
		child_process: 'child_process'
	},
	mode: 'production'
}