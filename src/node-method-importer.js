const { req } = require('./req');

class NodeMethodImporter{
    importMethods(config){
        return Promise.resolve(req(config.path));
    }
}

module.exports = { NodeMethodImporter };