import { Event } from './event';

export class CancellationToken extends Event{
    constructor(){
        super();
        this.cancelled = false;
    }
    cancel(){
        this.dispatch();
    }
    dispatch(){
        if(this.cancelled){
            return;
        }
        super.dispatch();
        this.cancelled = true;
        this.listeners.splice(0, this.listeners.length);
    }
    addListener(listener){
        if(this.cancelled){
            listener();
            return;
        }
        super.addListener(listener);
    }
}