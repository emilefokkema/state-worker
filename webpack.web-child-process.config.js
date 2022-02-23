const path = require('path');

module.exports = {
	entry: './src/web-state-worker-child-process.js',
	output: {
		filename: 'web-child-process.js',
		path: path.resolve(__dirname, 'dist')
	},
	externals: {
		'./req': 'root req'
	},
	devtool: false,
	mode: 'production'
}