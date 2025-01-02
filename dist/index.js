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
exports.Flow = exports.flow = void 0;
const axios_1 = __importDefault(require("axios"));
const cachePreInterceptor = (reqConfig) => __awaiter(void 0, void 0, void 0, function* () {
    if (!reqConfig.cacheKey)
        return true;
    const savedResult = localStorage.getItem(`FLOW-CACHE-KEY-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`);
    const savedDate = +localStorage.getItem(`FLOW-CACHE-KEY-DATE-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`);
    if (savedResult !== null) {
        if (reqConfig.cacheLifetime && Date.now() - savedDate > reqConfig.cacheLifetime) {
            localStorage.removeItem(`FLOW-CACHE-KEY-${reqConfig.cacheKey}`);
            localStorage.removeItem(`FLOW-CACHE-KEY-DATE-${reqConfig.cacheKey}`);
            return true;
        }
        reqConfig.cachedResult = JSON.parse(savedResult);
    }
    return false;
});
const cachePostInterceptor = (result, reqConfig) => __awaiter(void 0, void 0, void 0, function* () {
    if (reqConfig.cacheKey) {
        localStorage.setItem(`FLOW-CACHE-KEY-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`, JSON.stringify(result));
        localStorage.setItem(`FLOW-CACHE-KEY-DATE-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`, Date.now().toString());
    }
});
const postInterceptors = [cachePostInterceptor];
const preInterceptors = [cachePreInterceptor];
const sendRequest = (reqConfig, config) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (config === null || config === void 0 ? void 0 : config.baseURL)
        reqConfig.baseURL = config.baseURL;
    if (preInterceptors.some((i) => __awaiter(void 0, void 0, void 0, function* () { return !(yield i(reqConfig, config)); })))
        return reqConfig.cachedResult || {};
    let result;
    try {
        const response = yield (0, axios_1.default)(reqConfig);
        result = { data: response.data };
    }
    catch (error) {
        if (!axios_1.default.isAxiosError(error)) {
            console.error("Unexpected error\nDetails: empty response");
            result = { error };
        }
        else {
            const serverError = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
            if (serverError instanceof ArrayBuffer || serverError instanceof Buffer) {
                try {
                    const parsedError = JSON.parse(new TextDecoder().decode(serverError));
                    result = { error: parsedError };
                }
                catch (parsingError) {
                    result = { error: serverError };
                }
            }
            else {
                result = { error: serverError };
            }
        }
    }
    if (reqConfig.outputResult) {
        console.log(JSON.stringify(result, null, 2));
    }
    yield Promise.all(postInterceptors.map(interceptor => interceptor(result, reqConfig)));
    return result;
});
exports.flow = {
    get: (url, reqConfig, config) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(Object.assign(Object.assign({}, reqConfig), { method: 'GET', url }), config);
    }),
    post: (url, data, reqConfig, config) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(Object.assign(Object.assign({}, reqConfig), { method: 'POST', url, data }), config);
    }),
    addPostInterceptor: (interceptor) => { postInterceptors.push(interceptor); },
    addPreInterceptor: (interceptor) => { preInterceptors.push(interceptor); }
};
class Flow {
    constructor(config) {
        this.get = (url, reqConfig) => __awaiter(this, void 0, void 0, function* () {
            return exports.flow.get(url, reqConfig, this.config);
        });
        this.post = (url, data, reqConfig) => __awaiter(this, void 0, void 0, function* () {
            return exports.flow.post(url, data, reqConfig, this.config);
        });
        this.config = config || {};
    }
}
exports.Flow = Flow;
const getPayloadHashCode = (reqConfig) => {
    const str = JSON.stringify(reqConfig.data);
    let hash = 0, i, chr;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
};
// const test = async () => {
//     const jsonFlow = new Flow({ baseURL: 'https://jsonplaceholder.typicode.com' })
//     await jsonFlow.get('/todos/1', { outputResult: true })
// }
//
// test().then()
