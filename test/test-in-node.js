const path = require('path')
const { NodeStateWorker } = require('../src/node-state-worker')
const example1 = {
	path: './node-state-example.js'
}

async function runExample(example){
	try{
		const resolvedPath = path.resolve(example.path);
		const worker = new NodeStateWorker(resolvedPath);
	}catch(e){
		console.log(e)
	}
}

runExample(example1);
