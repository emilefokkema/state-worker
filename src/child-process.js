const initializedType = 'initialized';
const executionCompletedType = 'executionCompleted';

export function start(importer, parentProcess){
    let scriptExport;
    let withState = {};

    async function initialize(msg){
        try{
            scriptExport = await importer.importMethods(msg.config, msg.baseURI);
            const { commands, queries } = scriptExport;
            if(commands && typeof commands !== 'object'){
                parentProcess.sendMessage({type: initializedType, error: `Exported member 'commands' is not an object`});
                return;
            }
            if(queries && typeof queries !== 'object'){
                parentProcess.sendMessage({type: initializedType, error: `Exported member 'queries' is not an object`});
                return;
            }
            const queryNames = queries ? Object.getOwnPropertyNames(queries) : [];
            const commandNames = commands ? Object.getOwnPropertyNames(commands) : [];
            if(queryNames.includes('terminate') || commandNames.includes('terminate')){
                parentProcess.sendMessage({type: initializedType, error: `'terminate' cannot be used as the name of a command or a query`});
                return;
            }
            parentProcess.sendMessage({type: initializedType, methodCollection: {queries: queryNames, commands: commandNames}})
        }catch(e){
            parentProcess.sendMessage({type: initializedType, error: e.toString()});
        }
    }
    async function execute(msg){
        try{
            const method = scriptExport.commands[msg.methodName] || scriptExport.queries[msg.methodName];
            const result = method.apply(withState, msg.args);
            parentProcess.sendMessage({type: executionCompletedType, result})
        }catch(e){
            parentProcess.sendMessage({type: executionCompletedType, error: e.toString()})
        }
    }

    parentProcess.addMessageEventListener((m) => {
        if(m.type === 'initialize'){
            initialize(m);
            return;
        }
        if(m.type === 'execution'){
            execute(m);
            return;
        }
    })
    
    parentProcess.sendMessage({type: 'started'});
}