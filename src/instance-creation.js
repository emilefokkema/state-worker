import { CancellationToken } from './events/cancellation-token';

export class InstanceCreation{
    constructor(){
        this.cancellationToken = new CancellationToken();
    }
    get cancelled(){
        return this.cancellationToken.cancelled;
    }
    onCancelled(listener){
        this.cancellationToken.addListener(listener);
    }
    cancel(){
        this.cancellationToken.cancel();
    }
}