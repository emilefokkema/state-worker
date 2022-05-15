export function start(importer, parentProcess){
    let commands;
    let queries;
    let state;
    function getWithState(executionId){
        return {
            state,
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
                await parentProcess.requestIdle(executionId);
                if(error !== undefined){
                    throw error;
                }
                return result;
            }
        };
    }

    parentProcess.onInitializationRequested.addListener(async ({config, baseURI, state: initialState}, sendResponse) => {
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
            state = initialState;
            sendResponse({methodCollection: {queries: queryNames, commands: commandNames}})
        }catch(e){
            sendResponse({error: e.toString()})
        }
    });

    parentProcess.onSetStateRequested.addListener(({state: _state}, sendResponse) => {
        state = _state;
        sendResponse();
    });

    parentProcess.onExecutionRequested.addListener(({methodName, args, id: executionId}, sendResponse) => {
        const query = queries[methodName];
        const command = commands[methodName];
        const method = command || query;
        const isCommand = method === command;
        const withState = getWithState(executionId);
        try{
            const result = method.apply(withState, args);
            state = withState.state;
            if(result instanceof Promise){
                result.then((res) => {
                    state = withState.state;
                    const response = {result: res};
                    if(isCommand){
                        response.state = state;
                    }
                    sendResponse(response)
                }).catch((e) => {
                    state = withState.state;
                    const response = {error: e.toString()};
                    if(isCommand){
                        response.state = state;
                    }
                    sendResponse(response)
                })
            }else{
                const response = {result};
                if(isCommand){
                    response.state = state;
                }
                sendResponse(response)
            }
        }catch(e){
            state = withState.state;
            const response = {error: e.toString()};
            if(isCommand){
                response.state = state;
            }
            sendResponse(response);
        }
    });

    parentProcess.notifyStarted();
}