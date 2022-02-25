export class WebMethodImporter{
    async importMethods(config, baseURI){
        const url = new URL(config.path, baseURI);
        if(config.module){
            return await req(url.toString());
        }else{
            importScripts(url.toString());
            if(typeof commands === 'undefined'){
                if(typeof queries === 'undefined'){
                    return {commands: {}, queries: {}};
                }
                return {queries, commands: {}};
            }
            if(typeof queries === 'undefined'){
                return {queries: {}, commands};
            }
            return {commands, queries};
        }
    }
}