import { cancellable } from './cancellable';

export function getNext(eventSource, cancellationToken){
    if(cancellationToken){
        eventSource = cancellable(eventSource);
    }
    return new Promise((res) => {
        const listener = (...args) => {
            eventSource.removeListener(listener);
            res(args);
        };
        eventSource.addListener(listener, cancellationToken);
    });
}