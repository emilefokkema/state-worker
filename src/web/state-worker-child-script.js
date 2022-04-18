import { WebMethodImporter } from './method-importer';
import { WebParentProcess } from './parent-process';
import { start } from '../child-process';
import { wrapParentProcess } from '../parent-process-wrapper';

const importer = new WebMethodImporter();
const parentProcess = wrapParentProcess(new WebParentProcess());

start(importer, parentProcess);