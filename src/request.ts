class RequestWrapper extends Request {
	constructor(reqInfo: RequestInfo, reqInit: RequestInit) {
		super(reqInfo, reqInit);
	}
}

export type FetchRequest = Request;
export { RequestWrapper as Request };
