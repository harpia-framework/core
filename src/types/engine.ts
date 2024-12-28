import type { Application } from "../server";

export interface Engine {
	configure: (app: Application) => void;
	render: (view: string, data: Record<string, any>) => Promise<string>;
}
