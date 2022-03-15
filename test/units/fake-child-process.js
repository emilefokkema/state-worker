import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { RequestAndResponse } from './request-and-response';

export class FakeChildProcess{
    constructor(){
        this.hasTerminated = false;
        this.started = new Event();
        this.terminated = new Event();
        this.initialization = new RequestAndResponse();
        this.state = new RequestAndResponse();
        this.execution = new RequestAndResponse();
    }
    getInitializationRequest(){
        return this.initialization.request.getOrWaitForItem();
    }
    getStateRequest(){
        return this.state.request.getOrWaitForItem();
    }
    getState(){
        return this.state.getResponse();
    }
    performExecution(execution){
        return this.execution.getResponse(execution);
    }
    whenStarted(){
        return getNext(this.started);
    }
    async whenTerminated(){
        if(this.hasTerminated){
            return;
        }
        await getNext(this.terminated);
    }
    terminate(){
        this.hasTerminated = true;
        this.terminated.dispatch();
    }
    initialize(config, baseURI, state){
        return this.initialization.getResponse({config, baseURI, state});
    }
}