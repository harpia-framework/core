import path from "node:path";
import { Middleware } from "./middlewares";
import { Response } from "./response";
import { Router } from "./router";

import type { FetchRequest } from "./request";
import type { FetchResponse } from "./response";
import type { Handler } from "./types/handler";

export class Application {
	private static instance: Application | null = null;

	private router: Router;
	private middlewares: Middleware;
	private staticPath: string | null = null;

	private constructor() {
		this.router = Router.getInstance();
		this.middlewares = new Middleware();
	}

	public static getInstance(): Application {
		if (!Application.instance) {
			Application.instance = new Application();
		}

		return Application.instance;
	}

	public listen(port: number, handler: () => void) {
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

		const urlPath = new URL(req.url).pathname;
		const route = this.router.isRouteMatching(urlPath, req.method);
		const staticFileExists = await this.resolveStaticFiles(urlPath, response);

		if (!route) {
			if (this.staticPath && staticFileExists) {
				return response.parse();
			}

			return response.parse();
		}

		if (!route.controller) {
			throw new Error("Controller handler is missing.");
		}

		const request = new Request(req, {});
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
}
