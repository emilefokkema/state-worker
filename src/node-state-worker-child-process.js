const initializedType = 'initialized';
let scriptExport;
function initialize(msg){
    try{
        scriptExport = require(msg.path);
        const { commands, queries } = scriptExport;
        if(commands && typeof commands !== 'object'){
            process.send({type: initializedType, error: `Exported member 'commands' is not an object`})
        }
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