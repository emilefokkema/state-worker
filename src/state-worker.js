export class StateWorker{
    constructor(manager, queries, commands){
        for(let query of queries){
            this[query] = function(...args){
                return manager.executeQuery(query, args);
            };
        }
        for(let command of commands){
            this[command] = function(...args){
                return manager.executeCommand(command, args);
            }
        }
        this.terminate = () => manager.terminate();
    }
}