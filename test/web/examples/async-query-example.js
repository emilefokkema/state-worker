function doExpensiveWork(){
    let foo = 123;
    let i = 0;
    while(i < 150000000){
        foo = (foo + 127) % 17;
        i++;
    }
}

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