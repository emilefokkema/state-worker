const initializedType = 'initialized';

export function start(importer, parentProcess){
    let scriptExport;
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
            const queryNames = Object.getOwnPropertyNames(queries);
            const commandNames = Object.getOwnPropertyNames(commands);
            if(queryNames.includes('terminate') || commandNames.includes('terminate')){
                parentProcess.sendMessage({type: initializedType, error: `'terminate' cannot be used as the name of a command or a query`});
                return;
            }
            parentProcess.sendMessage({type: initializedType, methodCollection: {queries: queryNames, commands: commandNames}})
        }catch(e){
            parentProcess.sendMessage({type: initializedType, error: e.toString()});
        }
    }

    parentProcess.addMessageEventListener((m) => {
        if(m.type === 'initialize'){
            initialize(m);
        }
    })
    
    parentProcess.sendMessage({type: 'started'});
}