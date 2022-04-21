import { RequestSource } from './events/request-source';
import { RequestTarget } from './events/request-target';
import { filter } from './events/filter';

class ParentProcessWrapper{
    constructor(parentProcess){
        this.parentProcess = parentProcess;
        const requestSource = new RequestSource(parentProcess);
        this.onExecutionRequested = filter(requestSource, ({type}) => type === 'execution');
        this.onStateRequested = filter(requestSource, ({type}) => type === 'state');
        this.onInitializationRequested = filter(requestSource, ({type}) => type === 'initialize');
        this.requestTarget = new RequestTarget(parentProcess);
    }
    notifyStarted(){
        this.parentProcess.sendMessage({type: 'started'});
    }
    notifyIdle(){
        this.parentProcess.sendMessage({type: 'idle'});
    }
    requestIdle(executionId){
        return this.requestTarget.getResponse({type: 'requestIdle', executionId});
    }
}

export function wrapParentProcess(process){
    return new ParentProcessWrapper(process);
}