"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flow = void 0;
const axios_1 = __importDefault(require("axios"));
const interceptors = [];
const sendRequest = (config) => __awaiter(void 0, void 0, void 0, function* () {
    let result;
    try {
        result = { data: (yield (0, axios_1.default)(config)).data };
    }
    catch (error) {
        if (!error.response) {
            console.error("Unexpected error\nDetails: empty response");
            result = { error };
        }
        else {
            const serverError = error.response.data;
            if (serverError instanceof ArrayBuffer || serverError instanceof Buffer)
                result = { error: JSON.parse(new TextDecoder().decode(serverError)) };
            else
                result = { error: serverError };
        }
    }
    if (config.outputResult)
        console.log(JSON.stringify(result, null, 2));
    interceptors.forEach(i => i(result, config));
    return result;
});
exports.flow = {
    get: (url, config) => {
        return sendRequest(Object.assign(Object.assign({}, config), { method: 'GET', url }));
    },
    post: (url, data, config) => {
        return sendRequest(Object.assign(Object.assign({}, config), { method: 'POST', url, data }));
    },
    addInterceptor: (event) => {
        interceptors.push(event);
    }
};
// const test = async () => {
//     await flow.get('https://jsonplaceholde.typicode.com/todos/1', {outputResult: true})
// }
//
// test().then()
