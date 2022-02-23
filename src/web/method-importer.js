export class WebMethodImporter{
    async importMethods(config, baseURI){
        const url = new URL(config.path, baseURI);
        if(config.module){
            return await req(url.toString());
        }else{
            importScripts(url.toString());
            return {commands, queries};
        }
    }
}