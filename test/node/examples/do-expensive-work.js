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


module.exports = { doExpensiveWork };