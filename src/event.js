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
    getNext(predicate){
        return new Promise((res) => {
            const listener = (...args) => {
                if(predicate && !predicate(...args)){
                    return;
                }
                this.removeListener(listener);
                res(args);
            };
            this.addListener(listener);
        });
    }
}