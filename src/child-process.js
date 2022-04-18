export function start(importer, parentProcess){
    let commands;
    let queries;
    let withState = {
        async await(p){
            if(!(p instanceof Promise)){
                return p;
            }
            parentProcess.notifyIdle();
            let result, error;
            try{
                result = await p;
            }catch(e){
                error = e;
            }
            await parentProcess.requestIdle();
            if(error !== undefined){
                throw error;
            }
            return result;
        }
    };

    parentProcess.onInitializationRequested.addListener(async ({config, baseURI, state}, sendResponse) => {
        try{
            ({ commands, queries } = await importer.importMethods(config, baseURI));
            commands = commands || {};
            queries = queries || {};
            if(typeof commands !== 'object'){
                sendResponse({error: `Exported member 'commands' is not an object`})
                return;
            }
            if(typeof queries !== 'object'){
                sendResponse({error: `Exported member 'queries' is not an object`})
                return;
            }
            const queryNames = Object.getOwnPropertyNames(queries);
            const commandNames = Object.getOwnPropertyNames(commands);
            if(queryNames.includes('terminate') || commandNames.includes('terminate')){
                sendResponse({error: `'terminate' cannot be used as the name of a command or a query`})
                return;
            }
            withState.state = state;
            sendResponse({methodCollection: {queries: queryNames, commands: commandNames}})
        }catch(e){
            sendResponse({error: e.toString()})
        }
    });

    parentProcess.onExecutionRequested.addListener(({methodName, args}, sendResponse) => {
        try{
            const method = commands[methodName] || queries[methodName];
            const result = method.apply(withState, args);
            if(result instanceof Promise){
                result.then((res) => sendResponse({result: res})).catch((e) => sendResponse({error: e.toString()}))
            }else{
                sendResponse({result})
            }
        }catch(e){
            sendResponse({error: e.toString()})
        }
    });

    parentProcess.onStateRequested.addListener((_, sendResponse) => {
        const { state } = withState;
        sendResponse(state);
    });

    parentProcess.notifyStarted();
}