import { getNext } from './events/get-next';

async function throwWhenCancelled(cancellationToken){
    await getNext(cancellationToken);
    throw new Error();
}

export function executeAndThrowWhenCancelled(fn, cancellationToken){
    return Promise.race([throwWhenCancelled(cancellationToken), fn()]);
}