import { pipe } from './pipe';

export function merge(source, sourceSelector){
    return pipe(source, function(listener) {
        let attached = true;
        const self = this;
        const selectedSources = [];
        const selectedSourceListener = (...args) => {
            if(!attached){
                return;
            }
            if(!self.attached){
                for(let selectedSource of selectedSources){
                    selectedSource.removeListener(selectedSourceListener);
                }
                attached = false;
                return;
            }
            listener(...args);
        };
        return (...args) => {
            const selectedSource = sourceSelector(...args);
            selectedSource.addListener(selectedSourceListener);
            selectedSources.push(selectedSource);
        };
    });
}