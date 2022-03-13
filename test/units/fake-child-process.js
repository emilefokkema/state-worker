import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { RequestAndResponse } from './request-and-response';

export class FakeChildProcess{
    constructor(){
        this.started = new Event();
        this.initialization = new RequestAndResponse();
        this.state = new RequestAndResponse();
        this.execution = new RequestAndResponse();
    }
    get initializationRequest(){
        return this.initialization.request;
    }
    get stateRequest(){
        return this.state.request;
    }
    get executionRequest(){
        return this.execution.request;
    }
    getState(){
        return this.state.getResponse();
    }
    performExecution(execution){
        return this.execution.getResponse(execution);
    }
    async notifyStarted(){
        const initializationRequestPromise = getNext(this.initializationRequest);
        this.started.dispatch();
        const [request] = await initializationRequestPromise;
        return request;
    }
    whenStarted(){
        return getNext(this.started);
    }
    initialize(config, baseURI, state){
        return this.initialization.getResponse({config, baseURI, state});
    }
}