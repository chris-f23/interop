import { IncomingHttpHeaders } from "http";
import express, { Application } from "express";
import { Server } from "http";

type HttpServerRequestParams<TPath extends string> = Partial<{
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  path: Record<string, unknown>;
  headers: IncomingHttpHeaders;
}>;

type HttpServerResponse = {
  statusCode: number;
  body?: Record<string, unknown>;
};

type HttpServerEndpointHandler<TPath extends string> = (
  request: HttpServerRequestParams<TPath>
) => Promise<HttpServerResponse>;

type HttpServerEndpointConfig<TPath extends string> = {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: TPath;
  handler: HttpServerEndpointHandler<any>;
};

type HttpServerConfig = {
  port: number;
  endpoints: HttpServerEndpointConfig<string>[];
};

export class HttpServer {
  app: Application;
  startedServer: Server | undefined;

  constructor(public readonly config: HttpServerConfig) {
    this.app = express();
    for (const endpoint of this.config.endpoints) {
      this.app[endpoint.method](endpoint.path, async (req, res, next) => {
        try {
          const response = await endpoint.handler({
            query: req.query,
            body: req.body,
            path: req.params,
            headers: req.headers,
          });
          res.status(response.statusCode).json(response.body);
        } catch (error) {
          next(error);
        }
      });
    }
  }

  async listen() {
    this.startedServer = this.app.listen(this.config.port);
  }

  async terminate() {
    this.startedServer?.close();
  }
}
