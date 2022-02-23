const commands = {
	initialize(state){
		this.state = state;
	},
	multiplyBy(x){
		this.state = x * this.state;
	}
};

const queries = {
	getDifferenceWith(y){
		return y - this.state;
	}
};

export {commands, queries};