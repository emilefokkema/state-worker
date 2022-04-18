import { Event } from './events/event';
import { merge } from './events/merge';

export class StateWorkerInstance {
	constructor(processFactory, config, baseURI, id){
		this.baseURI = baseURI;
		this.processFactory = processFactory;
		this.config = config;
		this.process = undefined;
		this.processCreated = new Event();
		this.id = id;
		this.onIdle = merge(this.processCreated, process => process.onIdle);
		this.onIdleRequested = merge(this.processCreated, process => process.onIdleRequested);
	}
	terminate(){
		if(this.process){
			this.process.terminate();
			this.process = undefined;
		}
	}
	createProcess(){
		this.process = this.processFactory();
		this.processCreated.dispatch(this.process);
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