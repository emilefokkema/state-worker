export class Execution{
    constructor(methodName, args, isCommand){
        this.methodName = methodName;
        this.args = args;
        this.isCommand = isCommand;
    }
}