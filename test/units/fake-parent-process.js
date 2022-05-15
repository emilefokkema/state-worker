import { Event } from '../../src/events/event';
import { RequestAndResponse } from './request-and-response';

export class FakeParentProcess{
    constructor(){
        this.started = new Event();
        this.idle = new Event();
        this.idleRequest = new RequestAndResponse();
        this.onExecutionRequested = new RequestAndResponse();
        this.onInitializationRequested = new RequestAndResponse();
        this.onSetStateRequested = new RequestAndResponse();
    }
    initialize(request){
        return this.onInitializationRequested.getResponse(request);
    }
    setState(state){
        return this.onSetStateRequested.getResponse({state});
    }
    execute(request){
        return this.onExecutionRequested.getResponse(request);
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