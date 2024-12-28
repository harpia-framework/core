import type { Handler } from "./handler";
import type { MethodOptions } from "./router";

export type NotFoundTypes = {
	handler: Handler;
	methods?: MethodOptions[];
} | null;
