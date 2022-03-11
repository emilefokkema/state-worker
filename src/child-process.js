import { wrapParentProcess } from './parent-process-wrapper';

export function start(importer, parentProcess){
    const wrappedParentProcess = wrapParentProcess(parentProcess);
    let commands;
    let queries;
    let withState = {};

    wrappedParentProcess.onInitializationRequested.addListener(async ({config, baseURI, state}, sendResponse) => {
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

    wrappedParentProcess.onExecutionRequested.addListener(({methodName, args}, sendResponse) => {
        try{
            const method = commands[methodName] || queries[methodName];
            const result = method.apply(withState, args);
            sendResponse({result})
        }catch(e){
            sendResponse({error: e.toString()})
        }
    });

    wrappedParentProcess.onStateRequested.addListener((_, sendResponse) => {
        const { state } = withState;
        sendResponse(state);
    });

    wrappedParentProcess.notifyStarted();
}