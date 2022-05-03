import { CancellationToken } from './events/cancellation-token';

export class InstanceCreation{
    constructor(){
        this.cancellationToken = new CancellationToken();
    }
}