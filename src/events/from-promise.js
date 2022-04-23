import { Event } from './event';

class PromiseBasedEventSource extends Event{
    constructor(promise){
        super();
        this.resolved = false;
        this.result = undefined;
        promise.then((result) => {
            this.resolved = true;
            this.result = result;
            this.dispatch(result);
        });
    }
    addListener(listener){
        if(this.resolved){
            listener(this.result);
            return;
        }
        super.addListener(listener);
    }
}

export function fromPromise(p){
    return new PromiseBasedEventSource(p);
}