export class StateWorkerInstance {
	constructor(processFactory, config, baseURI){
		this.baseURI = baseURI;
		this.processFactory = processFactory;
		this.config = config;
		this.process = undefined;
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
	async getState(){
		const resultPromise = this.whenReceivedMessageOfType('state');
		this.process.sendMessage({type: 'requestState'});
		const result = await resultPromise;
		return result.state;
	}
	performExecution(execution){
		const resultPromise = this.whenReceivedMessageOfType('executionCompleted');
		this.process.sendMessage({type: 'execution', methodName: execution.methodName, args: execution.args});
		return resultPromise;
	}
	async initialize(state){
		this.createProcess();
		await this.whenReceivedMessageOfType('started');
		const initializedPromise = this.whenReceivedMessageOfType('initialized');
		this.process.sendMessage({type: 'initialize', config: this.config, baseURI: this.baseURI, state});
		const result = await initializedPromise;
		if(result.error){
			this.terminate();
			throw new Error(result.error);
		}
		return result.methodCollection;
	}
}