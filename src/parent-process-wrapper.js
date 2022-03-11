import { RequestSource } from './events/request-source';
import { filter } from './events/filter';

class ParentProcessWrapper{
    constructor(parentProcess){
        this.parentProcess = parentProcess;
        const requestSource = new RequestSource(parentProcess);
        this.onExecutionRequested = filter(requestSource, ({type}) => type === 'execution');
        this.onStateRequested = filter(requestSource, ({type}) => type === 'state');
        this.onInitializationRequested = filter(requestSource, ({type}) => type === 'initialize');
    }
    notifyStarted(){
        this.parentProcess.sendMessage({type: 'started'});
    }
}

export function wrapParentProcess(process){
    return new ParentProcessWrapper(process);
}