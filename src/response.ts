class ResponseWrapper {
	private headersInstance: Headers;
	private statusCode: number;
	private body: any;
	
	constructor() {
		this.headersInstance = new Headers();
		this.statusCode = 200;
		this.body = null;
	}
	
	public parse(): Response {
		return new Response(this.body, {
			headers: this.headersInstance,
			status: this.statusCode
		});
	}
}

export type FetchResponse = Response;
export { ResponseWrapper as Response };