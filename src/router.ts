import type { Handler } from "./types/handler";
import type { RouteInterface } from "./types/router";

export class Router {
	private static instance: Router | null = null;
	private routes: RouteInterface[];

	private constructor() {
		this.routes = [];
	}

	public static getInstance(): Router {
		if (!Router.instance) {
			Router.instance = new Router();
		}

		return Router.instance;
	}

	public register(routes: RouteInterface[]): void {
		this.routes.push(...routes);
	}

	public list(): RouteInterface[] {
		return this.routes;
	}

	public get(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "GET", path, handlers, controller });

		return this;
	}

	public post(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "POST", path, handlers, controller });

		return this;
	}

	public put(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "PUT", path, handlers, controller });

		return this;
	}

	public delete(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "DELETE", path, handlers, controller });

		return this;
	}

	public patch(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "PATCH", path, handlers, controller });

		return this;
	}

	public options(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "OPTIONS", path, handlers, controller });

		return this;
	}

	public head(path: string, ...handlers: Handler[]): this {
		const controller = handlers.pop();

		if (!controller) {
			throw new Error("Controller handler is required.");
		}

		this.routes.push({ method: "HEAD", path, handlers, controller });

		return this;
	}

	public isRouteMatching(url: string, method: string): RouteInterface | null {
		const urlSegments = url.split("/").filter(Boolean);

		for (const route of this.routes) {
			const routeSegments = route.path.split("/").filter(Boolean);

			if (route.method !== method) {
				continue;
			}

			if (urlSegments.length !== routeSegments.length) {
				continue;
			}

			const isSegmentMatching = routeSegments.every((segment, index) => {
				return segment.startsWith(":") || segment === urlSegments[index];
			});

			if (isSegmentMatching) {
				return route;
			}
		}

		return null;
	}
}
