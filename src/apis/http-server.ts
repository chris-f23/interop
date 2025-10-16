import { IncomingHttpHeaders } from "http";
import express, { Application } from "express";
import { RouteParameters } from "express-serve-static-core";
import { Server } from "http";
import cors from "cors";

type HttpServerRequestParams<TPath extends string> = Partial<{
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  path: RouteParameters<TPath>;
  headers: IncomingHttpHeaders;
}>;

type HttpServerResponse<TBody = any> = {
  statusCode: number;
  body?: TBody;
};

type HttpServerEndpointHandlerHelper = {
  unauthorized: <TErrorBody = any>(error: TErrorBody) => HttpServerResponse;
  forbidden: <TErrorBody = any>(error: TErrorBody) => HttpServerResponse;
  badRequest: <TErrorBody = any>(error: TErrorBody) => HttpServerResponse;
  notFound: <TErrorBody = any>(error: TErrorBody) => HttpServerResponse;
  ok: <TBody = any>(data: TBody) => HttpServerResponse;
};

type HttpServerEndpointHandler<TPath extends string> = (
  request: HttpServerRequestParams<TPath>,
  helper: HttpServerEndpointHandlerHelper
) => Promise<HttpServerResponse>;

// type HttpServerEndpointConfig<TPath extends string> = {
//   method: "get" | "post" | "put" | "delete" | "patch";
//   path: TPath;
//   handler: HttpServerEndpointHandler<TPath>;
// };

type HttpServerConfig = {
  port: number;
};

export class HttpServer {
  app: Application;
  startedServer: Server | undefined;
  // endpoints: HttpServerEndpointConfig<TPath>[] = [];

  helper: HttpServerEndpointHandlerHelper = {
    badRequest(error) {
      return {
        statusCode: 400,
        body: error,
      };
    },
    forbidden(error) {
      return {
        statusCode: 403,
        body: error,
      };
    },
    notFound(error) {
      return {
        statusCode: 404,
        body: error,
      };
    },
    ok(data) {
      return {
        statusCode: 200,
        body: data,
      };
    },
    unauthorized(error) {
      return {
        statusCode: 401,
        body: error,
      };
    },
  };

  constructor(public readonly config: HttpServerConfig) {
    this.app = express();
    this.app.use(express.json());
    this.app.use(cors());
  }

  addEndpoint<TPath extends string>(
    method: "get" | "post" | "put" | "delete" | "patch",
    path: TPath,
    handler: HttpServerEndpointHandler<TPath>
  ) {
    this.app[method](path, async (req, res, next) => {
      try {
        const request: HttpServerRequestParams<TPath> = {
          query: req.query,
          body: req.body,
          path: req.params,
          headers: req.headers,
        };
        const response = await handler(request, this.helper);
        res.status(response.statusCode).json(response.body);
      } catch (error) {
        next(error);
      }
    });
  }

  async listen(): Promise<HttpServer> {
    this.startedServer = this.app.listen(this.config.port);
    return this;
  }

  async terminate() {
    this.startedServer?.close();
  }
}
