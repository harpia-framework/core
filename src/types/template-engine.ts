export type Data = Record<string, any>;
export type Blocks = Record<string, string>;
export type PluginFunction = (...args: any[]) => string;
export type Options = {
	path: {
		viewsPath: string;
		layoutsPath: string;
		partialsPath: string;
	};
	viewName?: string;
};
