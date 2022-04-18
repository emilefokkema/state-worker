class PipedEventSource{
    constructor(eventSource, mapFn){
        this.eventSource = eventSource;
        this.mapFn = mapFn;
        this.listeners = [];
    }
    addListener(listener){
        const record = {attached: true};
        const mappedListener = this.mapFn.apply(record, [listener]);
        record.listener = listener;
        record.mappedListener = mappedListener;
        this.listeners.push(record);
        this.eventSource.addListener(mappedListener);
    }
    removeListener(listener){
        const index = this.listeners.findIndex(l => l.listener === listener);
        if(index === -1){
            return;
        }
        const [record] = this.listeners.splice(index, 1);
        this.eventSource.removeListener(record.mappedListener);
        record.attached = false;
    }
}

export function pipe(eventSource, mapFn){
    return new PipedEventSource(eventSource, mapFn);
}