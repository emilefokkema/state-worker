import { pipe } from './pipe';

export function filter(eventSource, predicate){
    if(!predicate){
        return eventSource;
    }
    return pipe(eventSource, listener => (...args) => {
        if(!predicate(...args)){
            return;
        }
        listener(...args);
    });
}