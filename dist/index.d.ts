import { AxiosRequestConfig } from "axios";
interface FlowRequestConfig extends AxiosRequestConfig {
    outputResult?: boolean;
    baseUrl?: string;
    cacheKey?: string;
    cachedResult?: FlowResult<any, any>;
    cacheLifetime?: number;
    cacheOnlySuccess?: boolean;
}
interface FlowConfig {
    baseURL?: string;
}
type postInterceptorType = (result: FlowResult<any, any>, config: FlowRequestConfig) => Promise<any>;
type preInterceptorType = (reqConfig: FlowRequestConfig, config?: FlowConfig) => Promise<boolean>;
interface FlowResult<Data, Error> {
    data?: Data;
    error?: Error;
}
export declare const flow: {
    get: <ResponseData = any, Error = any>(url: string, reqConfig?: FlowRequestConfig, config?: FlowConfig) => Promise<FlowResult<ResponseData, Error>>;
    post: <ResponseData = any, Error = any>(url: string, data: any, reqConfig?: FlowRequestConfig, config?: FlowConfig) => Promise<FlowResult<ResponseData, Error>>;
    addPostInterceptor: (interceptor: postInterceptorType) => void;
    addPreInterceptor: (interceptor: preInterceptorType) => void;
};
export declare class Flow {
    private readonly config;
    constructor(config?: FlowConfig);
    get: <ResponseData = any, Error = any>(url: string, reqConfig?: FlowRequestConfig) => Promise<FlowResult<ResponseData, Error>>;
    post: <ResponseData = any, Error = any>(url: string, data: any, reqConfig?: FlowRequestConfig) => Promise<FlowResult<ResponseData, Error>>;
}
export {};
