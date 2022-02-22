const { req } = require('./req');
const initializedType = 'initialized';
let scriptExport;
function initialize(msg){
    try{
        scriptExport = req(msg.path);
        const { commands, queries } = scriptExport;
        if(commands && typeof commands !== 'object'){
            process.send({type: initializedType, error: `Exported member 'commands' is not an object`});
            return;
        }
        if(queries && typeof queries !== 'object'){
            process.send({type: initializedType, error: `Exported member 'queries' is not an object`})
            return;
        }
        const queryNames = Object.getOwnPropertyNames(queries);
        const commandNames = Object.getOwnPropertyNames(commands);
        process.send({type: initializedType, methodCollection: {queries: queryNames, commands: commandNames}})
    }catch(e){
        process.send({type: initializedType, error: e.toString()})
    }
    
}
process.on('message', (m) => {
    if(m.type === 'initialize'){
        initialize(m);
    }
});
process.send({type: 'started'})