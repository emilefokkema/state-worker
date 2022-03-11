class PipedEventSource{
    constructor(eventSource, mapFn){
        this.eventSource = eventSource;
        this.mapFn = mapFn;
        this.listeners = [];
    }
    addListener(listener){
        const mappedListener = this.mapFn(listener);
        this.listeners.push({listener, mappedListener});
        this.eventSource.addListener(mappedListener);
    }
    removeListener(listener){
        const index = this.listeners.findIndex(l => l.listener === listener);
        if(index === -1){
            return;
        }
        const [record] = this.listeners.splice(index, 1);
        this.eventSource.removeListener(record.mappedListener);
    }
}

export function pipe(eventSource, mapFn){
    return new PipedEventSource(eventSource, mapFn);
}