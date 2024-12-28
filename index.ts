import { Router as RouterClass } from "./src/router";
import { Application } from "./src/server";

export { Request } from "./src/request";
export { Response } from "./src/response";

export default function harpia(): Application {
	return Application.getInstance();
}

export function Router(): RouterClass {
	return RouterClass.getInstance();
}
