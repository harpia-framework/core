class RequestWrapper extends Request {
	public params: Record<string, string>;
	public query: Record<string, string>;

	constructor(reqInfo: RequestInfo, reqInit: RequestInit, url: string, routePath: string) {
		super(reqInfo, reqInit);

		this.params = this.extractParams(url, routePath);
		this.query = this.extractQuery(url);
	}

	private extractParams(url: string, routePath: string): Record<string, string> {
		const params: Record<string, string> = {};

		const urlPath = new URL(url).pathname;
		const urlSegments = urlPath.split("/").filter(Boolean);
		const routeSegments = routePath.split("/").filter(Boolean);

		for (const [index, segment] of routeSegments.entries()) {
			if (segment.startsWith(":")) {
				const paramName = segment.slice(1);
				params[paramName] = urlSegments[index] || "";
			}
		}

		return params;
	}

	private extractQuery(url: string): Record<string, string> {
		const parsedUrl = new URL(url);
		const qs = new URL(url, parsedUrl.host).search;
		const query = new URLSearchParams(qs);
		const mapper: Record<string, string> = {};

		for (const [key, value] of query.entries()) {
			mapper[key] = value;
		}

		return mapper;
	}
}

export type FetchRequest = Request;
export { RequestWrapper as Request };
