import { pipe } from './pipe';
import { cancellable } from './cancellable';

export function merge(source, sourceSelector){
    return pipe(source, function(listener) {
        const cancellationToken = this.cancellationToken;
        return (...args) => {
            const selectedSource = cancellable(sourceSelector(...args));
            selectedSource.addListener(listener, cancellationToken);
        };
    });
}