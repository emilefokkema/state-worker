export class Event{
    constructor(){
        this.listeners = [];
    }
    addListener(listener){
        this.listeners.push(listener);
    }
    removeListener(listener){
        const index = this.listeners.indexOf(listener);
        if(index === -1){
            return;
        }
        this.listeners.splice(index, 1);
    }
    dispatch(...args){
        const listenersToNotify = this.listeners.slice();
        for(let listenerToNotify of listenersToNotify){
            listenerToNotify(...args);
        }
    }
}