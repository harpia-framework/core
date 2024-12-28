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

	private async handleRequest(req: FetchRequest): Promise<FetchResponse> {
		const response = new Response();

		const urlPath = new URL(req.url).pathname;
		const route = this.router.isRouteMatching(urlPath, req.method);

		if (!route) {
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
