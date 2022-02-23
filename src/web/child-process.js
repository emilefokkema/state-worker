export class WebChildProcess{
    constructor(worker){
        this.worker = worker;
        this.listeners = [];
    }
    sendMessage(msg){
        this.worker.postMessage(msg);
    }
    addMessageEventListener(listener){
        const mappedListener = ({data}) => {
            listener(data);
        };
        this.listeners.push({listener, mappedListener});
        this.worker.addEventListener('message', mappedListener);
    }
    removeMessageEventListener(listener){
        const index = this.listeners.findIndex(l => l.listener === listener);
        if(index === -1){
            return;
        }
        const [record] = this.listeners.splice(index, 1);
        this.worker.removeEventListener('message', record.mappedListener);
    }
    static create(url, module){
        const worker = new Worker(url, {type: module ? 'module' : 'classic'});
        worker.addEventListener('error', (e) => {console.log(e)})
        return new WebChildProcess(worker);
    }
}