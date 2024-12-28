import { Router as RouterClass } from "./src/router";
import { Application } from "./src/server";

export { Request } from "./src/request";
export { Response } from "./src/response";

export type { Application as Harpia } from "./src/server";
export type { CorsOptions } from "./src/types/cors";
export type { CookiesOptions } from "./src/types/cookies";
export type { Store } from "./src/types/store";

export default function harpia(): Application {
	return Application.getInstance();
}

export function Router(): RouterClass {
	return RouterClass.getInstance();
}
