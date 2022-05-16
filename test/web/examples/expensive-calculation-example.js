function doExpensiveWork(times){
    if(times === undefined){
        times = 1;
    }
    let foo = 123;
    let i = 0;
    while(i < 150000000 * times){
        foo = (foo + 127) % 17;
        i++;
    }
}

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