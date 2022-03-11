export class StateWorkerInstance {
	constructor(processFactory, config, baseURI, id){
		this.baseURI = baseURI;
		this.processFactory = processFactory;
		this.config = config;
		this.process = undefined;
		this.id = id;
	}
	terminate(){
		if(this.process){
			this.process.terminate();
			this.process = undefined;
		}
	}
	createProcess(){
		this.process = this.processFactory();
	}
	getState(){
		return this.process.getState();
	}
	performExecution(execution){
		return this.process.performExecution(execution);
	}
	async initialize(state){
		this.createProcess();
		await this.process.whenStarted();
		const result = await this.process.initialize(this.config, this.baseURI, state);
		if(result.error){
			this.terminate();
			throw new Error(result.error);
		}
		return result.methodCollection;
	}
}