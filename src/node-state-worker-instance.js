const { fork } = require('child_process');

class NodeStateWorkerInstance{
	constructor(childProcessScriptPath, scriptPath){
		this.childProcessScriptPath = childProcessScriptPath;
		this.scriptPath = scriptPath;
		this.process = undefined;
	}
	whenReceivedMessageOfType(type){
		return new Promise((res) => {
			const listener = (msg) => {
				if(msg.type === type){
					this.process.removeListener('message', listener);
					res(msg);
				}
			};
			this.process.addListener('message', listener);
		});
	}
	createProcess(){
		this.process = fork(this.childProcessScriptPath, [], {
			stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
			serialization: 'advanced'
		});
		this.process.stdout.on('data', (data) => {
			console.log(data.toString())
		});
		this.process.on('error', (err) => {
			console.log('child process error', err)
		});
		this.process.stderr.on('data', (data) => {
			console.log('data from stderr')
			console.log(data.toString())
		});
		this.process.on('exit', (code, signal) => {
			console.log('child process has exited')
		});
	}
	async initialize(){
		this.createProcess();
		await this.whenReceivedMessageOfType('started');
		const initializedPromise = this.whenReceivedMessageOfType('initialized');
		this.process.send({type: 'initialize', path: this.scriptPath});
		const result = await initializedPromise;
		if(result.error){
			throw new Error(result.error);
		}
		return result.methodCollection;
	}
}

module.exports = { NodeStateWorkerInstance }