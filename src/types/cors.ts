import type { MethodOptions } from "./router";

export interface CorsOptions {
	origin?:
		| boolean
		| string
		| RegExp
		| Array<string | RegExp>
		| ((origin: string, callback: (err?: Error, origin?: string) => void) => void);
	methods?: "*" | MethodOptions | MethodOptions[];
	allowedHeaders?: string | string[];
	exposedHeaders?: string | string[];
	credentials?: boolean;
	maxAge?: number;
	preflightContinue?: boolean;
	optionsSuccessStatus?: number;
}
