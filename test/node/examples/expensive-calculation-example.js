const { doExpensiveWork } = require('./do-expensive-work');

const commands = {
	initialize(state){
		this.state = state;
	},
	multiplyBy(x){
        doExpensiveWork();
		this.state = x * this.state;
	}
};

const queries = {
	getDifferenceWith(y){
        doExpensiveWork(2);
		return y - this.state;
	}
};

module.exports = {commands, queries}