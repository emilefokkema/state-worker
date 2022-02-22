const commands = function(){};

const queries = {
	getDifferenceWith(y){
		return y - this.state;
	}
};

module.exports = {commands, queries}