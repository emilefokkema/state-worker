const initializedType = 'initialized';
const executionCompletedType = 'executionCompleted';

export function start(importer, parentProcess){
    let commands;
    let queries;
    let withState = {};

    async function initialize(msg){
        try{
            ({ commands, queries } = await importer.importMethods(msg.config, msg.baseURI));
            commands = commands || {};
            queries = queries || {};
            if(typeof commands !== 'object'){
                parentProcess.sendMessage({type: initializedType, error: `Exported member 'commands' is not an object`});
                return;
            }
            if(typeof queries !== 'object'){
                parentProcess.sendMessage({type: initializedType, error: `Exported member 'queries' is not an object`});
                return;
            }
            const queryNames = Object.getOwnPropertyNames(queries);
            const commandNames = Object.getOwnPropertyNames(commands);
            if(queryNames.includes('terminate') || commandNames.includes('terminate')){
                parentProcess.sendMessage({type: initializedType, error: `'terminate' cannot be used as the name of a command or a query`});
                return;
            }
            withState.state = msg.state;
            parentProcess.sendMessage({type: initializedType, methodCollection: {queries: queryNames, commands: commandNames}})
        }catch(e){
            parentProcess.sendMessage({type: initializedType, error: e.toString()});
        }
    }
    function execute(msg){
        try{
            const method = commands[msg.methodName] || queries[msg.methodName];
            const result = method.apply(withState, msg.args);
            parentProcess.sendMessage({type: executionCompletedType, result})
        }catch(e){
            parentProcess.sendMessage({type: executionCompletedType, error: e.toString()})
        }
    }
    function sendState(){
        const { state } = withState;
        parentProcess.sendMessage({type: 'state', state});
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
        if(m.type === 'requestState'){
            sendState();
            return;
        }
    })
    
    parentProcess.sendMessage({type: 'started'});
}