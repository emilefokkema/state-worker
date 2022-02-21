const path = require('path')
const { NodeStateWorker } = require('../src/node-state-worker')
const example2 = {
	path: './node-state-example.js',
	sequence: [
		{
			command: 'initialize',
			args: [2]
		},
		{
			query: 'getDifferenceWith',
			args: [1],
			expectedResult: -1
		}
	]
}
async function executePartOfSequence(part, worker){
	if(part.query){
		const result = await worker[part.query].apply(worker, part.args)
	}else if(part.command){
		await worker[part.command].apply(worker, part.args)
	}
}
async function runExample(example){
	try{
		const resolvedPath = path.resolve(__dirname, example.path);
		const worker = await NodeStateWorker.create(resolvedPath, {maxNumberOfProcesses: 2});
		for(let part of example.sequence){
			executePartOfSequence(part, worker).catch((e) => {
				console.log(e)
				process.exit(1)
			})
		}
	}catch(e){
		console.log(e)
	}
	console.log('done running example')
}

runExample(example2).then(() => process.exit(0));
