export function getNext(eventSource){
    return new Promise((res) => {
        const listener = (...args) => {
            eventSource.removeListener(listener);
            res(args);
        };
        eventSource.addListener(listener);
    });
}