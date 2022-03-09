const queries = {
    getSomething(){
        throw new Error('failed to get something')
    }
};

module.exports = { queries }