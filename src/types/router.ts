import type { Handler } from "./handler";

export type MethodOptions = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

export interface RouteInterface {
	method: MethodOptions;
	path: string;
	handlers: Handler[];
	controller: Handler;
}
