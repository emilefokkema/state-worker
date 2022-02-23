import { runExamples } from './example-runner';

const example1 = {
	path: 'web-state-example-1.js',
	module: false,
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
};
const example2 = {
	path: 'web-state-example-2.js',
	module: true,
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
};

function createWorker(example){
    return StateWorker.create({maxNumberOfProcesses: 2, path: example.path, module: example.module})
}

runExamples([example1, example2], createWorker).catch(e => console.error(e))