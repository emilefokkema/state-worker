/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./test/example-runner.js":
/*!********************************!*\
  !*** ./test/example-runner.js ***!
  \********************************/
/***/ ((module) => {

eval("async function executePartOfSequence(part, worker){\n\tif(part.query){\n\t\ttry{\n\t\t\tconst result = await worker[part.query].apply(worker, part.args)\n\t\t}catch(e){\n\t\t\treturn {error: `Error when executing query '${part.query}': ${e}`}\n\t\t}\n\t\treturn {};\n\t}else if(part.command){\n\t\ttry{\n\t\t\tawait worker[part.command].apply(worker, part.args);\n\t\t}catch(e){\n\t\t\treturn {error: `Error when executing command '${part.command}': ${e}`}\n\t\t}\n\t\treturn {};\n\t}\n}\n\nasync function runExample(example, workerFactory){\n\tlet worker;\n\ttry{\n\t\tworker = await workerFactory(example);\n\t}catch(e){\n\t\tif(!example.initializationError){\n\t\t\treturn {error: `Did not expect an error from initialization, but error was thrown: ${e}`}\n\t\t}\n\t\treturn {};\n\t}\n\tif(example.initializationError){\n\t\treturn {error: 'Expected an error to have been thrown from initialization, but none was thrown.'}\n\t}\n\tconst sequencePromises = example.sequence.map(part => ({part, promise: executePartOfSequence(part, worker)}));\n\tfor(let i = 0; i < sequencePromises.length; i++){\n\t\tconst partPromise = sequencePromises[i];\n\t\tconst partResult = await partPromise.promise;\n\t\tif(partResult.error){\n\t\t\treturn {error: `Error from part ${i} of sequence: ${partResult.error}`}\n\t\t}\n\t}\n\treturn {};\n}\n\nasync function runExamples(examples, workerFactory){\n\tlet hasError = false;\n\tfor(let i = 0; i < examples.length; i++){\n\t\tconst example = examples[i];\n\t\tconst result = await runExample(example, workerFactory);\n\t\tif(result.error){\n\t\t\tconsole.error(`Error from running example ${i}: ${result.error}`);\n\t\t\thasError = true;\n\t\t}else{\n\t\t\tconsole.log(`Example ${i} ran successfully`)\n\t\t}\n\t}\n\tif(hasError){\n\t\tthrow new Error(`not all test cases succeeded`)\n\t}\n}\n\nmodule.exports = { runExamples };\n\n//# sourceURL=webpack://state-worker/./test/example-runner.js?");

/***/ }),

/***/ "./test/run-web-tests.js":
/*!*******************************!*\
  !*** ./test/run-web-tests.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _example_runner__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./example-runner */ \"./test/example-runner.js\");\n/* harmony import */ var _example_runner__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_example_runner__WEBPACK_IMPORTED_MODULE_0__);\n\n\nconst example1 = {\n\tpath: 'web-state-example-1.js',\n\tmodule: false,\n\tsequence: [\n\t\t{\n\t\t\tcommand: 'initialize',\n\t\t\targs: [2]\n\t\t},\n\t\t{\n\t\t\tquery: 'getDifferenceWith',\n\t\t\targs: [1],\n\t\t\texpectedResult: -1\n\t\t}\n\t]\n};\nconst example2 = {\n\tpath: 'web-state-example-2.js',\n\tmodule: true,\n\tsequence: [\n\t\t{\n\t\t\tcommand: 'initialize',\n\t\t\targs: [2]\n\t\t},\n\t\t{\n\t\t\tquery: 'getDifferenceWith',\n\t\t\targs: [1],\n\t\t\texpectedResult: -1\n\t\t}\n\t]\n};\n\nfunction createWorker(example){\n    return StateWorker.create({maxNumberOfProcesses: 2, path: example.path, module: example.module})\n}\n\n(0,_example_runner__WEBPACK_IMPORTED_MODULE_0__.runExamples)([example1, example2], createWorker).catch(e => console.error(e))\n\n//# sourceURL=webpack://state-worker/./test/run-web-tests.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./test/run-web-tests.js");
/******/ 	
/******/ })()
;