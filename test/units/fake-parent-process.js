import { Event } from '../../src/events/event';
import { RequestAndResponse } from './request-and-response';

export class FakeParentProcess{
    constructor(){
        this.started = new Event();
        this.idle = new Event();
        this.idleRequest = new RequestAndResponse();
        this.onExecutionRequested = new RequestAndResponse();
        this.onStateRequested = new RequestAndResponse();
        this.onInitializationRequested = new RequestAndResponse();
    }
    initialize(request){
        return this.onInitializationRequested.getResponse(request);
    }
    execute(request){
        return this.onExecutionRequested.getResponse(request);
    }
    getState(){
        return this.onStateRequested.getResponse();
    }
    notifyStarted(){
        this.started.dispatch();
    }
    notifyIdle(){
        this.idle.dispatch();
    }
    requestIdle(executionId){
        return this.idleRequest.getResponse({executionId});
    }
}