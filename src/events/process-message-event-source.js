export class ProcessMessageEventSource{
    constructor(process){
        this.process = process;
    }
    addListener(listener){
        this.process.addMessageEventListener(listener);
    }
    removeListener(listener){
        this.process.removeMessageEventListener(listener);
    }
}