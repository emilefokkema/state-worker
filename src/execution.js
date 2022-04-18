import { CancellationToken } from './events/cancellation-token';

export class Execution{
    constructor(methodName, args, isCommand){
        this.methodName = methodName;
        this.args = args;
        this.isCommand = isCommand;
        this.cancellationToken = new CancellationToken();
    }
    toString(){
        return `${this.methodName}(${this.args.map(a => JSON.stringify(a)).join(', ')})`
    }
}