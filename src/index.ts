import axios, {Axios, AxiosError, AxiosRequestConfig} from "axios"

interface FlowRequestConfig extends AxiosRequestConfig {
    outputResult?: boolean
}

const interceptors: ((result: FlowResult<any, any>, config: FlowRequestConfig) => any)[] = []

interface FlowResult<Data, Error> {
    data?: Data
    error?: Error
}

const sendRequest = async <ResponseData, ErrorType>(config: FlowRequestConfig) => {
    let result
    try {
        result = {data: (await axios<ResponseData>(config)).data}
    }
    catch (error) {
        if (!(error as AxiosError).response) {
            console.error("Unexpected error\nDetails: empty response")
            result = {error} as FlowResult<ResponseData, ErrorType>
        }
        else {
            const serverError = (error as AxiosError).response!.data

            if (serverError instanceof ArrayBuffer || serverError instanceof Buffer)
                result = {error: JSON.parse(new TextDecoder().decode(serverError)) as ErrorType}
            else result = {error: serverError as ErrorType}
        }
    }
    if (config.outputResult) console.log(JSON.stringify(result, null, 2))

    interceptors.forEach(i => i(result, config))
    return result as FlowResult<ResponseData, ErrorType>
}

export const flow = {
    get: <ResponseData = any, Error = any>(url: string, config?: FlowRequestConfig) => {
        return sendRequest<ResponseData, Error>({...config, method: 'GET', url})
    },
    post: <ResponseData = any, Error = any>(url: string, data: any, config?: FlowRequestConfig) => {
        return sendRequest<ResponseData, Error>({...config, method: 'POST', url, data})
    },
    addInterceptor: (event: () => any) => {
        interceptors.push(event)
    }
}

// const test = async () => {
//     await flow.get('https://jsonplaceholde.typicode.com/todos/1', {outputResult: true})
// }
//
// test().then()