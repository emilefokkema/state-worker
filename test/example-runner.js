async function executePartOfSequence(part, worker){
	if(part.query){
		try{
			const result = await worker[part.query].apply(worker, part.args)
		}catch(e){
			return {error: `Error when executing query '${part.query}': ${e}`}
		}
		return {};
	}else if(part.command){
		try{
			await worker[part.command].apply(worker, part.args);
		}catch(e){
			return {error: `Error when executing command '${part.command}': ${e}`}
		}
		return {};
	}
}

async function runExample(example, workerFactory){
	let worker;
	try{
		worker = await workerFactory(example);
	}catch(e){
		if(!example.initializationError){
			return {error: `Did not expect an error from initialization, but error was thrown: ${e}`}
		}
		return {};
	}
	if(example.initializationError){
		return {error: 'Expected an error to have been thrown from initialization, but none was thrown.'}
	}
	const sequencePromises = example.sequence.map(part => ({part, promise: executePartOfSequence(part, worker)}));
	for(let i = 0; i < sequencePromises.length; i++){
		const partPromise = sequencePromises[i];
		const partResult = await partPromise.promise;
		if(partResult.error){
			return {error: `Error from part ${i} of sequence: ${partResult.error}`}
		}
	}
	return {};
}

async function runExamples(examples, workerFactory){
	let hasError = false;
	for(let i = 0; i < examples.length; i++){
		const example = examples[i];
		const result = await runExample(example, workerFactory);
		if(result.error){
			console.error(`Error from running example ${i}: ${result.error}`);
			hasError = true;
		}else{
			console.log(`Example ${i} ran successfully`)
		}
	}
	if(hasError){
		throw new Error(`not all test cases succeeded`)
	}
}

module.exports = { runExamples };