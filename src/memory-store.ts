import type { Store } from "./types/store";

export class MemoryStore implements Store {
	private sessions = new Map<string, Record<string, any>>();

	async get(sessionId: string): Promise<Record<string, any> | undefined> {
		return this.sessions.get(sessionId);
	}

	async set(sessionId: string, data: Record<string, any>): Promise<void> {
		this.sessions.set(sessionId, data);
	}

	async delete(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
	}
}
