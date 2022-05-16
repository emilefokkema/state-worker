class CancellableEventSource{
    constructor(eventSource){
        this.eventSource = eventSource;
    }
    addListener(listener, cancellationToken){
        this.eventSource.addListener(listener);
        if (cancellationToken) {
            cancellationToken.addListener(() => {
                this.removeListener(listener);
            });
        }
    }
    removeListener(listener){
        this.eventSource.removeListener(listener);
    }
}

export function cancellable(eventSource){
    return new CancellableEventSource(eventSource);
}