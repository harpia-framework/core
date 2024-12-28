export type SameSiteOptions = "Strict" | "Lax" | "None";

export interface CookiesOptions {
	path?: string;
	domain?: string;
	maxAge?: number;
	expires?: Date;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: SameSiteOptions;
}

export interface CookieScopeOptions {
	path?: string;
	domain?: string;
}
