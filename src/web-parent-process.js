export class WebParentProcess{
    constructor(){
        this.listeners = [];
    }
    sendMessage(msg){
        postMessage(msg);
    }
    addMessageEventListener(listener){
        const mappedListener = ({data}) => {
            listener(data);
        };
        this.listeners.push({listener, mappedListener});
        addEventListener('message', mappedListener);
    }
    removeMessageEventListener(listener){
        const index = this.listeners.findIndex(l => l.listener === listener);
        if(index === -1){
            return;
        }
        const [record] = this.listeners.splice(index, 1);
        removeEventListener('message', record.mappedListener);
    }
}