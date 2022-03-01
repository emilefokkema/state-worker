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
		worker_threads: 'worker_threads',
		path: 'path'
	},
	node: {
		__dirname: false
	},
	devtool: false,
	mode: 'production'
}