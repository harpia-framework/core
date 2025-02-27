import path from "node:path";
import { Cors } from "./cors";
import { Middleware } from "./middlewares";
import { Request } from "./request";
import { Response } from "./response";
import { Router } from "./router";

import type { Server } from "bun";
import type { FetchRequest } from "./request";
import type { FetchResponse } from "./response";
import type { CorsOptions } from "./types/cors";
import type { Engine } from "./types/engine";
import type { Handler, HandlerResult } from "./types/handler";
import type { NotFoundTypes } from "./types/not-found";
import type { MethodOptions } from "./types/router";
import type { ServerOptions } from "./types/server";
import { WebSocket, type WebSocketHandlers } from "./websocket";

export class Application {
  private static instance: Application | null = null;
  private serverInstance: Server | null = null;
  private ipAdress: string | null = null;

  private router: Router;
  private middlewares: Middleware;
  private corsInstance: Cors;
  private notFound: NotFoundTypes = null;
  private staticPath: string | null = null;
  private templateEngine: Engine | null = null;
  private websocket: WebSocket;

  public engine = {
    set: (engine: Engine) => this.setTemplateEngine(engine),
    get: () => this.getTemplateEngine(),
  };

  public constructor() {
    this.router = new Router();
    this.middlewares = new Middleware();
    this.corsInstance = new Cors();
    this.websocket = new WebSocket();
  }

  public static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }

    return Application.instance;
  }

  public listen(options: ServerOptions, handler?: () => void) {
    if (!options.port && !options.unix) {
      throw new Error("Either 'port' or 'unix' must be specified in ServerOptions.");
    }

    if (options.port && options.unix) {
      throw new Error("Cannot specify both 'port' and 'unix'. Choose one.");
    }

    if (options.port) {
      if (typeof options.port !== "number" || options.port < 1 || options.port > 65535) {
        throw new Error("'port' must be a number between 1 and 65535.");
      }
    }

    if (options.unix && options.hostname) {
      throw new Error("'hostname' cannot be used with 'unix'.");
    }

    if (options.unix && options.tls) {
      throw new Error("'tls' cannot be used with 'unix'. TLS is only applicable to TCP connections.");
    }

    const commonConfig = {
      development: options.development,
      maxRequestBodySize: options.maxRequestBodySize,
      websocket: this.websocket.all(),
      fetch: this.handleRequest.bind(this),
    };

    if (options.unix) {
      this.serverInstance = Bun.serve({
        unix: options.unix,
        ...commonConfig,
      });
    } else {
      this.serverInstance = Bun.serve({
        port: options.port,
        hostname: options.hostname,
        reusePort: options.reusePort,
        tls: options.tls,
        ...commonConfig,
      });
    }

    if (handler) {
      handler();
    }
  }

  public ws<DataType = any>(path: string, handlers: WebSocketHandlers<DataType>): void {
    this.websocket.register(path, handlers as WebSocketHandlers<unknown>);
  }

  public stop(): void {
    if (this.serverInstance) {
      this.serverInstance.stop();
    }
  }

  public server(): Server {
    if (!this.serverInstance) {
      throw new Error("Server is not running.");
    }

    return this.serverInstance;
  }

  private setRequestIP(req: FetchRequest, server: Server): void {
    this.ipAdress = server.requestIP(req)?.address || null;
  }

  public requestIP(): string | null {
    return this.ipAdress;
  }

  public routes(routes: Router): void {
    this.router.register({ routes: routes.list() });
  }

  public use(app: Application | string | Handler, handler?: Handler): void {
    if (typeof app === "string" && handler) {
      this.middlewares.set(app, handler);
    } else {
      this.middlewares.set("*", app as Handler);
    }
  }

  public cors(options?: CorsOptions) {
    this.corsInstance.options = options || null;
  }

  public setNotFound(handler: Handler, methods?: MethodOptions[]): void {
    this.notFound = {
      handler,
      methods,
    };
  }

  public static(path: string): void {
    this.staticPath = path;
  }

  public get(path: string, ...handlers: Handler[]): void {
    this.router.get(path, ...handlers);
  }

  public post(path: string, ...handlers: Handler[]): void {
    this.router.post(path, ...handlers);
  }

  public put(path: string, ...handlers: Handler[]): void {
    this.router.put(path, ...handlers);
  }

  public delete(path: string, ...handlers: Handler[]): void {
    this.router.delete(path, ...handlers);
  }

  public patch(path: string, ...handlers: Handler[]): void {
    this.router.patch(path, ...handlers);
  }

  public options(path: string, ...handlers: Handler[]): void {
    this.router.options(path, ...handlers);
  }

  public head(path: string, ...handlers: Handler[]): void {
    this.router.head(path, ...handlers);
  }

  public async processRequest(req: FetchRequest): Promise<FetchResponse> {
    return this.handleRequest(req);
  }

  private resolveNotFound(req: FetchRequest, res: Response, urlPath: string) {
    if (this.notFound) {
      const request = new Request(req, {}, req.url, urlPath, req.method);

      if (!this.notFound.methods) {
        return this.notFound.handler(request, res, () => {});
      }

      for (const method of this.notFound.methods) {
        if (method === req.method) {
          return this.notFound.handler(request, res, () => {});
        }
      }
    }
  }

  private async resolveStaticFiles(urlPath: string, res: Response): Promise<boolean> {
    if (this.staticPath) {
      const filePath = path.join(this.staticPath, urlPath);
      const file = Bun.file(filePath);
      const fileExists = await file.exists();

      if (fileExists) {
        const fileType = file.type || "application/octet-stream";
        const fileContent = await file.arrayBuffer();

        res.headers.set("Content-Type", fileType);
        res.send(new Uint8Array(fileContent));

        return true;
      }

      return false;
    }

    return false;
  }

  private async methodOverride(req: FetchRequest, res: Response, urlPath: string): Promise<Request> {
    const request = new Request(req, {}, req.url, urlPath, req.method);
    const isPost = req.method === "POST";
    const contentType = req.headers.get("content-type")?.includes("application/x-www-form-urlencoded");

    if (isPost && contentType) {
      const formData = new URLSearchParams(await req.text());
      const overrideMethod = formData.get("_method")?.toUpperCase();
      const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];

      if (overrideMethod && validMethods.includes(overrideMethod)) {
        request.method = overrideMethod;
      }
    }

    return request;
  }

  private async handleRequest(req: FetchRequest, server?: Server): Promise<FetchResponse> {
    if (server) {
      this.setRequestIP(req, server);
    }

    const response = new Response();

    // Checks if the request is a WebSocket
    if (server?.upgrade(req, { data: { url: req.url } })) {
      return response.parse();
    }

    if (this.corsInstance.options) {
      const isCorsAllowed = this.corsInstance.setCors(req, response, () => {});

      if (!isCorsAllowed) {
        return response.parse();
      }
    }

    const urlPath = new URL(req.url).pathname;
    const request = await this.methodOverride(req, response, urlPath);
    const route = this.router.isRouteMatching(urlPath, request.method);
    const staticFileExists = await this.resolveStaticFiles(urlPath, response);

    if (!route) {
      if (this.staticPath && staticFileExists) {
        return response.parse();
      }

      this.resolveNotFound(req, response, urlPath);

      return response.parse();
    }

    if (!route.controller) {
      throw new Error("Controller handler is missing.");
    }

    // Execute global middlewares
    const middlewareList = this.middlewares.isMiddlewareMatching(urlPath);
    if (middlewareList.length > 0) {
      const execution = await this.executeHandlers(middlewareList, request, response);

      if (execution instanceof Response) {
        return execution.parse();
      }
    }

    // Execute route middlewares
    const handlers = [...(route ? route.handlers : [])];
    if (handlers.length > 0) {
      const execution = await this.executeHandlers(handlers, request, response);

      if (execution instanceof Response) {
        return execution.parse();
      }
    }

    await route.controller(request, response, () => {});

    return response.parse();
  }

  private async executeHandlers(handlers: Handler[], req: Request, res: Response): Promise<HandlerResult> {
    let index = -1;

    const next = async (): Promise<HandlerResult> => {
      index++;

      if (index < handlers.length) {
        const handler = handlers[index];

        if (typeof handler !== "function") {
          throw new Error("Middleware handler must be a function.");
        }

        const result = await handler(req, res, next);

        if (result instanceof Response) {
          return result;
        }

        return next();
      }

      return undefined;
    };

    return await next();
  }

  private setTemplateEngine(engine: Engine): void {
    this.templateEngine = engine;
  }

  private getTemplateEngine(): Engine | null {
    return this.templateEngine;
  }
}
