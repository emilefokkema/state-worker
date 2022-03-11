import { pipe } from '../events/pipe';

class WorkerMessageEventSource{
    constructor(worker){
        this.worker = worker;
    }
    addListener(listener){
        this.worker.addEventListener('message', listener);
    }
    removeListener(listener){
        this.worker.removeEventListener('message', listener);
    }
}

export class WebChildProcess{
    constructor(worker){
        this.worker = worker;
        this.workerMessageEventSource = pipe(new WorkerMessageEventSource(worker), listener => ({data}) => listener(data));
    }
    terminate(){
        if(this.worker){
            this.worker.terminate();
            this.worker = undefined;
        }
    }
    sendMessage(msg){
        this.worker.postMessage(msg);
    }
    addMessageEventListener(listener){
        this.workerMessageEventSource.addListener(listener);
    }
    removeMessageEventListener(listener){
        this.workerMessageEventSource.removeListener(listener);
    }
    static create(url, module){
        const worker = new Worker(url, {type: module ? 'module' : 'classic'});
        worker.addEventListener('error', (e) => {console.log(e)})
        return new WebChildProcess(worker);
    }
}