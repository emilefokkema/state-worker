import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { RequestAndResponse } from './request-and-response';

export class FakeChildProcess{
    constructor(){
        this.hasTerminated = false;
        this.started = new Event();
        this.terminated = new Event();
        this.initialization = new RequestAndResponse();
        this.execution = new RequestAndResponse();
        this.onIdleRequested = new RequestAndResponse();
        this.setStateRequest = new RequestAndResponse();
        this.onIdle = new Event();
        this.hasStarted = false;
        getNext(this.started).then(() => {this.hasStarted = true;})
    }
    getInitializationRequest(){
        return this.initialization.request.getOrWaitForItem();
    }
    getSetStateRequest(){
        return this.setStateRequest.request.getOrWaitForItem();
    }
    performExecution(execution){
        if(this.hasTerminated){
            return new Promise(() => {});
        }
        return this.execution.getResponse(execution);
    }
    setState(state){
        if(this.hasTerminated){
            return new Promise(() => {});
        }
        return this.setStateRequest.getResponse(state);
    }
    requestIdle(executionId){
        return this.onIdleRequested.getResponse({executionId});
    }
    async whenStarted(){
        if(this.hasTerminated){
            return new Promise(() => {});
        }
        await new Promise(res => setTimeout(res, 0))
        if(this.hasStarted){
            return;
        }
        await getNext(this.started);
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
        if(this.hasTerminated){
            return new Promise(() => {});
        }
        return this.initialization.getResponse({config, baseURI, state});
    }
}