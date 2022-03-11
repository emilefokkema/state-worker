export function getNext(eventSource, predicate){
    return new Promise((res) => {
        const listener = (...args) => {
            if(predicate && !predicate(...args)){
                return;
            }
            eventSource.removeListener(listener);
            res(args);
        };
        eventSource.addListener(listener);
    });
}