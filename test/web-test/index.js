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

eval("async function executePartOfSequence(part, worker){\r\n\tif(part.query){\r\n\t\ttry{\r\n\t\t\tconst result = await worker[part.query].apply(worker, part.args)\r\n\t\t}catch(e){\r\n\t\t\treturn {error: `Error when executing query '${part.query}': ${e}`}\r\n\t\t}\r\n\t\treturn {};\r\n\t}else if(part.command){\r\n\t\ttry{\r\n\t\t\tawait worker[part.command].apply(worker, part.args);\r\n\t\t}catch(e){\r\n\t\t\treturn {error: `Error when executing command '${part.command}': ${e}`}\r\n\t\t}\r\n\t\treturn {};\r\n\t}\r\n}\r\n\r\nasync function runExample(example, workerFactory){\r\n\tlet worker;\r\n\ttry{\r\n\t\tworker = await workerFactory(example);\r\n\t}catch(e){\r\n\t\tif(!example.initializationError){\r\n\t\t\treturn {error: `Did not expect an error from initialization, but error was thrown: ${e}`}\r\n\t\t}\r\n\t\treturn {};\r\n\t}\r\n\tif(example.initializationError){\r\n\t\treturn {error: 'Expected an error to have been thrown from initialization, but none was thrown.'}\r\n\t}\r\n\tconst sequencePromises = example.sequence.map(part => ({part, promise: executePartOfSequence(part, worker)}));\r\n\tfor(let i = 0; i < sequencePromises.length; i++){\r\n\t\tconst partPromise = sequencePromises[i];\r\n\t\tconst partResult = await partPromise.promise;\r\n\t\tif(partResult.error){\r\n\t\t\treturn {error: `Error from part ${i} of sequence: ${partResult.error}`}\r\n\t\t}\r\n\t}\r\n\treturn {};\r\n}\r\n\r\nasync function runExamples(examples, workerFactory){\r\n\tlet hasError = false;\r\n\tfor(let i = 0; i < examples.length; i++){\r\n\t\tconst example = examples[i];\r\n\t\tconst result = await runExample(example, workerFactory);\r\n\t\tif(result.error){\r\n\t\t\tconsole.error(`Error from running example ${i}: ${result.error}`);\r\n\t\t\thasError = true;\r\n\t\t}else{\r\n\t\t\tconsole.log(`Example ${i} ran successfully`)\r\n\t\t}\r\n\t}\r\n\tif(hasError){\r\n\t\tthrow new Error(`not all test cases succeeded`)\r\n\t}\r\n}\r\n\r\nmodule.exports = { runExamples };\n\n//# sourceURL=webpack://state-worker/./test/example-runner.js?");

/***/ }),

/***/ "./test/run-web-tests.js":
/*!*******************************!*\
  !*** ./test/run-web-tests.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _example_runner__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./example-runner */ \"./test/example-runner.js\");\n/* harmony import */ var _example_runner__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_example_runner__WEBPACK_IMPORTED_MODULE_0__);\n\r\n\r\nconst example1 = {\r\n\tpath: 'web-state-example-1.js',\r\n\tmodule: false,\r\n\tsequence: [\r\n\t\t{\r\n\t\t\tcommand: 'initialize',\r\n\t\t\targs: [2]\r\n\t\t},\r\n\t\t{\r\n\t\t\tquery: 'getDifferenceWith',\r\n\t\t\targs: [1],\r\n\t\t\texpectedResult: -1\r\n\t\t}\r\n\t]\r\n};\r\nconst example2 = {\r\n\tpath: 'web-state-example-2.js',\r\n\tmodule: true,\r\n\tsequence: [\r\n\t\t{\r\n\t\t\tcommand: 'initialize',\r\n\t\t\targs: [2]\r\n\t\t},\r\n\t\t{\r\n\t\t\tquery: 'getDifferenceWith',\r\n\t\t\targs: [1],\r\n\t\t\texpectedResult: -1\r\n\t\t}\r\n\t]\r\n};\r\n\r\nfunction createWorker(example){\r\n    return StateWorker.create({maxNumberOfProcesses: 2, path: example.path, module: example.module})\r\n}\r\n\r\n(0,_example_runner__WEBPACK_IMPORTED_MODULE_0__.runExamples)([example1, example2], createWorker).catch(e => console.error(e))\n\n//# sourceURL=webpack://state-worker/./test/run-web-tests.js?");

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