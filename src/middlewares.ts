import type { Handler } from "./types/handler";

export class Middleware {
	private middlewares: { path: string; handler: Handler }[];

	constructor() {
		this.middlewares = [];
	}

	public setMiddleware(path: string, handler: Handler): void {
		this.middlewares.push({ path, handler });
	}

	public isMiddlewareMatching(urlPath: string): Handler[] {
		const middlewareList = this.middlewares
			.filter((mw) => mw.path === "*" || urlPath.startsWith(mw.path))
			.map((mw) => mw.handler);

		return middlewareList;
	}
}
