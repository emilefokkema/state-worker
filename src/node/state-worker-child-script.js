import { NodeMethodImporter } from './method-importer';
import { NodeParentProcess } from './parent-process';
import { start } from '../child-process';
import { wrapParentProcess } from '../parent-process-wrapper';

const importer = new NodeMethodImporter();
const parentProcess = wrapParentProcess(new NodeParentProcess());

start(importer, parentProcess);