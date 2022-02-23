const path = require('path')
const StateWorker = require('../dist/state-worker')
const { runExamples } = require('./example-runner');

const example1 = {
	path: './node-state-example-1.js',
	initializationError: true
};
const example2 = {
	path: './node-state-example-2.js',
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



function createWorker(example){
	const resolvedPath = path.resolve(__dirname, example.path);
	return StateWorker.create({maxNumberOfProcesses: 2, path: resolvedPath});
}

runExamples([example2], createWorker).then(() => process.exit(0)).catch((e) => {
	console.error(e);
	process.exit(1);
});
