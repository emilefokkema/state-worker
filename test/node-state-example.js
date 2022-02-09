let state = 2;

function setState(_state){
	state = _state;
}

function getState(){
	return state;
}

const commands = {
	multiplyBy(x){
		state = x * state;
	}
};

const queries = {
	getDifferenceWith(y){
		return y - state;
	}
};

module.exports ={setState, getState, commands, queries}

