import { Event } from './events/event';
import { merge } from './events/merge';
import { fromPromise } from './events/from-promise';
import { getNext } from './events/get-next'; 

export class StateWorkerInstance {
	constructor(processFactory, config, baseURI, id){
		this.baseURI = baseURI;
		this.processFactory = processFactory;
		this.config = config;
		this.process = undefined;
		this.processCreated = new Event();
		this.id = id;
		const fromProcessCreatedPromise = fromPromise(this.getProcess());
		this.onIdle = merge(fromProcessCreatedPromise, process => process.onIdle);
		this.onIdleRequested = merge(fromProcessCreatedPromise, process => process.onIdleRequested);
	}
	terminate(){
		if(this.process){
			this.process.terminate();
			this.process = undefined;
		}
	}
	async getProcess(){
		if(this.process){
			return this.process;
		}
		const [result] = await getNext(this.processCreated);
		return result;
	}
	createProcess(){
		this.process = this.processFactory();
		this.processCreated.dispatch(this.process);
	}
	setState(state){
		return this.process.setState(state);
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