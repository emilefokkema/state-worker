export class Execution{
    constructor(methodName, args, isCommand){
        this.methodName = methodName;
        this.args = args;
        this.isCommand = isCommand;
    }
    toString(){
        return `${this.methodName}(${this.args.map(a => JSON.stringify(a)).join(', ')})`
    }
}