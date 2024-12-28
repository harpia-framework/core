import path from "node:path";
import { Cors } from "./cors";
import { Middleware } from "./middlewares";
import { Request } from "./request";
import { Response } from "./response";
import { Router } from "./router";

import type { FetchRequest } from "./request";
import type { FetchResponse } from "./response";
import type { CorsOptions } from "./types/cors";
import type { Engine } from "./types/engine";
import type { Handler } from "./types/handler";
import type { NotFoundTypes } from "./types/not-found";
import type { MethodOptions } from "./types/router";

export class Application {
	private static instance: Application | null = null;

	private router: Router;
	private middlewares: Middleware;
	private corsInstance: Cors;
	private notFound: NotFoundTypes = null;
	private staticPath: string | null = null;
	private templateEngine: Engine | null = null;

	public engine = {
		set: (engine: Engine) => this.setTemplateEngine(engine),
		get: () => this.getTemplateEngine(),
	};

	private constructor() {
		this.router = Router.getInstance();
		this.middlewares = new Middleware();
		this.corsInstance = new Cors();
	}

	public static getInstance(): Application {
		if (!Application.instance) {
			Application.instance = new Application();
		}

		return Application.instance;
	}

	public listen(port: number, handler?: () => void) {
		Bun.serve({
			port,
			fetch: this.handleRequest.bind(this),
		});

		if (handler) {
			handler();
		}
	}

	public routes(routes: Router): void {
		this.router.register(routes.list());
	}

	public use(app: Application | string | Handler, handler?: Handler): void {
		if (typeof app === "string" && handler) {
			this.middlewares.setMiddleware(app, handler);
		} else {
			this.middlewares.setMiddleware("*", app as Handler);
		}
	}

	public cors(options: CorsOptions) {
		this.corsInstance.options = options;
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

	private resolveNotFound(req: FetchRequest, res: Response, urlPath: string) {
		if (this.notFound) {
			const request = new Request(req, {}, req.url, urlPath);

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

	private async handleRequest(req: FetchRequest): Promise<FetchResponse> {
		const response = new Response();

		if (this.corsInstance.options) {
			const isCorsAllowed = this.corsInstance.setCors(req, response, () => {});

			if (!isCorsAllowed) {
				return response.parse();
			}
		}

		const urlPath = new URL(req.url).pathname;
		const route = this.router.isRouteMatching(urlPath, req.method);
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

		const request = new Request(req, {}, req.url, route.path);
		const handlers = [...this.middlewares.isMiddlewareMatching(urlPath), ...(route ? route.handlers : [])];
		if (handlers.length > 0) {
			this.executeHandlers(handlers, request, response);
		}

		await route.controller(request, response, () => {});

		return response.parse();
	}

	private executeHandlers(handlers: Handler[], req: Request, res: Response): void {
		const execute = (index: number): void => {
			if (handlers.length > index) {
				handlers[index](req, res, () => execute(index + 1));
			}
		};

		execute(0);
	}

	private setTemplateEngine(engine: Engine): void {
		this.templateEngine = engine;
	}

	private getTemplateEngine(): Engine | null {
		return this.templateEngine;
	}
}
