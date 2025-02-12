import type { Handler } from "./types/handler";

export class Middleware {
	private middlewares: { path: string; handler: Handler }[];

	constructor() {
		this.middlewares = [];
	}

	public set(path: string, handler: Handler): void {
		this.middlewares.push({ path, handler });
	}

	public all(): { path: string; handler: Handler }[] {
		return this.middlewares;
	}

	public isMiddlewareMatching(urlPath: string): Handler[] {
		const middlewareList = this.middlewares
			.filter((mw) => mw.path === "*" || urlPath.startsWith(mw.path))
			.map((mw) => mw.handler);

		return middlewareList;
	}
}
