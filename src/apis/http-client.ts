import axios, {
  Axios,
  RawAxiosRequestHeaders as HttpRequestHeaders,
  RawAxiosResponseHeaders as HttpResponseHeaders,
} from "axios";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type HttpRequestParams = {
  headers?: HttpRequestHeaders;
  body?: any;
  query?: Record<string, unknown>;
};

type HttpResponse<TBody> = {
  statusCode: number;
  headers: HttpResponseHeaders;
  body: TBody;
};

type HttpClientConfig = {
  timeout?: number;
  arrayQueryParameterSerializationMode?: "repeat" | "join";
};

export class HttpClient {
  client: Axios;

  constructor(
    public readonly config: HttpClientConfig = {
      timeout: 30000,
      arrayQueryParameterSerializationMode: "repeat",
    }
  ) {
    this.client = axios.create({
      timeout: this.config.timeout,
      validateStatus: () => true,
      paramsSerializer: (params) => {
        const paramsArray: string[] = [];
        for (const [paramKey, paramValue] of Object.entries(params)) {
          if (Array.isArray(paramValue)) {
            if (this.config.arrayQueryParameterSerializationMode === "join") {
              paramsArray.push(`${paramKey}=${paramValue.join(",")}`);
            }
            if (this.config.arrayQueryParameterSerializationMode === "repeat") {
              for (const value of paramValue) {
                paramsArray.push(`${paramKey}=${value}`);
              }
            }
            continue;
          }

          paramsArray.push(`${paramKey}=${paramValue}`);
        }

        if (paramsArray.length > 0) {
          return paramsArray.join("&");
        }

        return "";
      },
    });
  }

  private async call<TBody>(
    method: HttpMethod,
    url: string,
    requestParams?: HttpRequestParams
  ): Promise<HttpResponse<TBody>> {
    const response = await this.client[method](url, {
      params: requestParams?.query,
      headers: requestParams?.headers,
      data: requestParams?.body,
    });
    console.info(this.client.getUri(response.config));
    // console.info(
    //   `${response.status} ${response.config.method} ${response.config.url} ${}`
    // );
    return {
      body: response.data,
      headers: response.headers,
      statusCode: response.status,
    };
  }

  async get<TResponseBody>(
    url: string,
    requestParams?: Pick<HttpRequestParams, "headers" | "query">
  ): Promise<HttpResponse<TResponseBody>> {
    return this.call("get", url, requestParams);
  }

  async post<TResponseBody>(
    url: string,
    requestParams: HttpRequestParams
  ): Promise<HttpResponse<TResponseBody>> {
    return this.call("post", url, requestParams);
  }

  async put<TResponseBody>(
    url: string,
    requestParams: HttpRequestParams
  ): Promise<HttpResponse<TResponseBody>> {
    return this.call("put", url, requestParams);
  }

  async patch<TResponseBody>(
    url: string,
    requestParams: HttpRequestParams
  ): Promise<HttpResponse<TResponseBody>> {
    return this.call("patch", url, requestParams);
  }

  async delete<TResponseBody>(
    url: string,
    requestParams?: Pick<HttpRequestParams, "headers">
  ): Promise<HttpResponse<TResponseBody>> {
    return this.call("delete", url, requestParams);
  }
}
