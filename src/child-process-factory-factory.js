import { ChildProcessFactory as NodeChildProcessFactory } from './node/child-process-factory';
import { ChildProcessFactory as WebChildProcessFactory } from './web/child-process-factory';

export function createChildProcessFactory(){
    return typeof window === 'undefined' ? new NodeChildProcessFactory() : new WebChildProcessFactory();
}