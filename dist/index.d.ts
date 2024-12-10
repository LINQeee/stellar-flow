import { AxiosRequestConfig } from "axios";
interface FlowRequestConfig extends AxiosRequestConfig {
    outputResult?: boolean;
}
interface FlowResult<Data, Error> {
    data?: Data;
    error?: Error;
}
export declare const flow: {
    get: <ResponseData = any, Error = any>(url: string, config?: FlowRequestConfig) => Promise<FlowResult<ResponseData, Error>>;
    post: <ResponseData = any, Error = any>(url: string, data: any, config?: FlowRequestConfig) => Promise<FlowResult<ResponseData, Error>>;
    addInterceptor: (event: () => any) => void;
};
export {};
