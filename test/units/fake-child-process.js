import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { filter }from '../../src/events/filter';

export class FakeChildProcess{
    constructor(){
        this.started = new Event();
        this.initializationResponse = new Event();
        this.initializationRequest = new Event();
        this.latestExecutionRequestId = 0;
        this.executionRequest = new Event();
        this.stateRequest = new Event();
        this.executionResponse = new Event();
        this.stateResponse = new Event();
    }
    async getState(){
        this.stateRequest.dispatch();
        const [result] = await getNext(this.stateResponse);
        return result;
    }
    async performExecution(execution){
        const executionRequestId = this.latestExecutionRequestId++;
        this.executionRequest.dispatch(execution, executionRequestId);
        const [_, result] = await getNext(filter(this.executionResponse, (_executionRequestId) => _executionRequestId === executionRequestId));
        return result;
    }
    whenStarted(){
        return getNext(this.started);
    }
    async initialize(config, baseURI, state){
        this.initializationRequest.dispatch({config, baseURI, state});
        const [result] = await getNext(this.initializationResponse);
        return result;
    }
}