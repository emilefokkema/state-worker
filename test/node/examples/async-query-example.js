const { doExpensiveWork } = require('./do-expensive-work')

const queries = {
    async getSum(x){
        const partialSum = this.state + x;
        doExpensiveWork();
        await this.await(new Promise(res => setTimeout(res, 50)));
        doExpensiveWork();
        return partialSum + 1;
    }
};

const commands = {
    setState(x){
        this.state = x;
    }
};

module.exports = {commands, queries};