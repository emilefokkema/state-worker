const WebStateWorker = StateWorker.WebStateWorker;

async function runExample(){
    let worker;
    try{
        worker = await WebStateWorker.create();
    }catch(e){
        console.log(e)
    }
}

runExample();