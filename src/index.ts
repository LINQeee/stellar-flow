import axios, { AxiosRequestConfig } from "axios"

interface FlowRequestConfig extends AxiosRequestConfig {
    outputResult?: boolean
    baseUrl?: string
    cacheKey?: string
    cachedResult?: FlowResult<any, any>
    cacheLifetime?: number
    cacheOnlySuccess?: boolean
}

interface FlowConfig {
    baseURL?: string
}

type postInterceptorType = (result: FlowResult<any, any>, config: FlowRequestConfig) => Promise<any>
type preInterceptorType = (reqConfig: FlowRequestConfig, config?: FlowConfig) => Promise<boolean>

const cachePreInterceptor = async (reqConfig: FlowRequestConfig) => {
    if (!reqConfig.cacheKey) return true
    const savedResult = localStorage.getItem(`FLOW-CACHE-KEY-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`)
    const savedDate = +localStorage.getItem(`FLOW-CACHE-KEY-DATE-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`)!
    if (savedResult !== null) {
        if (reqConfig.cacheLifetime && Date.now() - savedDate > reqConfig.cacheLifetime) {
            localStorage.removeItem(`FLOW-CACHE-KEY-${reqConfig.cacheKey}`)
            localStorage.removeItem(`FLOW-CACHE-KEY-DATE-${reqConfig.cacheKey}`)
            return true
        }
        reqConfig.cachedResult = JSON.parse(savedResult)
    }
    return false
}

const cachePostInterceptor = async (result: FlowResult<any, any>, reqConfig: FlowRequestConfig) => {
    if (reqConfig.cacheKey) {
        localStorage.setItem(`FLOW-CACHE-KEY-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`, JSON.stringify(result))
        localStorage.setItem(`FLOW-CACHE-KEY-DATE-${reqConfig.cacheKey}-${getPayloadHashCode(reqConfig)}`, Date.now().toString())
    }
}

const postInterceptors: postInterceptorType[] = [cachePostInterceptor]
const preInterceptors: preInterceptorType[] = [cachePreInterceptor]

interface FlowResult<Data, Error> {
    data?: Data
    error?: Error
}

const sendRequest = async <ResponseData, ErrorType>(reqConfig: FlowRequestConfig, config?: FlowConfig): Promise<FlowResult<ResponseData, ErrorType>> => {
    if (config?.baseURL) reqConfig.baseURL = config.baseURL

    if (preInterceptors.some(async (i) => !(await i(reqConfig, config)))) return reqConfig.cachedResult || {}

    let result: FlowResult<ResponseData, ErrorType>
    try {
        const response = await axios<ResponseData>(reqConfig)
        result = { data: response.data }
    } catch (error) {
        if (!axios.isAxiosError(error)) {
            console.error("Unexpected error\nDetails: empty response")
            result = { error } as FlowResult<ResponseData, ErrorType>
        } else {
            const serverError = error.response?.data

            if (serverError instanceof ArrayBuffer || serverError instanceof Buffer) {
                try {
                    const parsedError = JSON.parse(new TextDecoder().decode(serverError))
                    result = { error: parsedError as ErrorType }
                } catch (parsingError) {
                    result = { error: serverError as unknown as ErrorType }
                }
            } else {
                result = { error: serverError as ErrorType }
            }
        }
    }

    if (reqConfig.outputResult) {
        console.log(JSON.stringify(result, null, 2))
    }

    await Promise.all(postInterceptors.map(interceptor => interceptor(result, reqConfig)))
    return result
}

export const flow = {
    get: async <ResponseData = any, Error = any>(url: string, reqConfig?: FlowRequestConfig, config?: FlowConfig): Promise<FlowResult<ResponseData, Error>> => {
        return sendRequest<ResponseData, Error>({ ...reqConfig, method: 'GET', url }, config)
    },
    post: async <ResponseData = any, Error = any>(url: string, data: any, reqConfig?: FlowRequestConfig, config?: FlowConfig): Promise<FlowResult<ResponseData, Error>> => {
        return sendRequest<ResponseData, Error>({ ...reqConfig, method: 'POST', url, data }, config)
    },
    addPostInterceptor: (interceptor: postInterceptorType): void => {postInterceptors.push(interceptor)},
    addPreInterceptor: (interceptor: preInterceptorType): void => {preInterceptors.push(interceptor)}
}

export class Flow {
    private readonly config: FlowConfig

    constructor(config?: FlowConfig) {
        this.config = config || {}
    }

    public get = async <ResponseData = any, Error = any>(url: string, reqConfig?: FlowRequestConfig): Promise<FlowResult<ResponseData, Error>> => {
        return flow.get<ResponseData, Error>(url, reqConfig, this.config)
    }

    public post = async <ResponseData = any, Error = any>(url: string, data: any, reqConfig?: FlowRequestConfig): Promise<FlowResult<ResponseData, Error>> => {
        return flow.post<ResponseData, Error>(url, data, reqConfig, this.config)
    }
}

const getPayloadHashCode = (reqConfig: FlowRequestConfig) => {
    const str = JSON.stringify(reqConfig.data)
    let hash = 0, i, chr
    if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash
    }

// const test = async () => {
//     const jsonFlow = new Flow({ baseURL: 'https://jsonplaceholder.typicode.com' })
//     await jsonFlow.get('/todos/1', { outputResult: true })
// }
//
// test().then()
