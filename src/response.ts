class ResponseWrapper {
	private headersInstance: Headers;
	private statusCode: number;
	private body: any;

	public headers: Headers;

	constructor() {
		this.headersInstance = new Headers();
		this.statusCode = 200;
		this.body = null;
		this.headers = this.getHeadersInstance();
	}

	public parse(): Response {
		return new Response(this.body, {
			headers: this.headersInstance,
			status: this.statusCode,
		});
	}

	private getHeadersInstance(): Headers {
		return this.headersInstance;
	}

	public status(value: number): this {
		this.statusCode = value;
		return this;
	}

	public send(data: any): this {
		this.body = data;
		this.headersInstance.set("Content-Lenght", data.length.toString());
		return this;
	}

	public json(data: any): this {
		this.headersInstance.set("Content-Type", "application/json");
		this.body = JSON.stringify(data);
		return this;
	}
}

export type FetchResponse = Response;
export { ResponseWrapper as Response };
