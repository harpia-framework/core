export interface Store {
	get(sessionId: string): Promise<Record<string, any> | undefined>;
	set(sessionId: string, data: Record<string, any>): Promise<void>;
	delete(sessionId: string): Promise<void>;
}
