export class StateWorkerInstance {
	constructor(processFactory, config, baseURI){
		this.baseURI = baseURI;
		this.processFactory = processFactory;
		this.config = config;
		this.process = undefined;
		this.busy = false;
	}
	terminate(){
		if(this.process){
			this.process.terminate();
			this.process = undefined;
		}
	}
	whenReceivedMessageOfType(type){
		return new Promise((res) => {
			const listener = (msg) => {
				if(msg.type === type){
					this.process.removeMessageEventListener(listener);
					res(msg);
				}
			};
			this.process.addMessageEventListener(listener);
		});
	}
	createProcess(){
		this.process = this.processFactory();
	}
	async performExecution(execution){
		this.busy = true;
		const resultPromise = this.whenReceivedMessageOfType('executionCompleted');
		this.process.sendMessage({type: 'execution', methodName: execution.methodName, args: execution.args});
		const result = await resultPromise;
		this.busy = false;
		if(result.error){
			throw new Error(result.error);
		}
		return result.result;
	}
	async initialize(){
		this.createProcess();
		await this.whenReceivedMessageOfType('started');
		const initializedPromise = this.whenReceivedMessageOfType('initialized');
		this.process.sendMessage({type: 'initialize', config: this.config, baseURI: this.baseURI});
		const result = await initializedPromise;
		if(result.error){
			throw new Error(result.error);
		}
		return result.methodCollection;
	}
}