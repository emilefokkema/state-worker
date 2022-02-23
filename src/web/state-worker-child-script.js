import { WebMethodImporter } from './method-importer';
import { WebParentProcess } from './parent-process';
import { start } from '../child-process';

const importer = new WebMethodImporter();
const parentProcess = new WebParentProcess();

start(importer, parentProcess);