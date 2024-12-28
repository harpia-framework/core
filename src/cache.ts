import { MemoryStore } from "./memory-store";
import type { Store } from "./types/store";

export class Cache {
	private store: Store;

	constructor(options?: { store?: Store }) {
		this.store = options?.store || new MemoryStore();
	}

	async get(key: string): Promise<any> {
		return this.store.get(key);
	}

	async set(key: string, value: any): Promise<void> {
		await this.store.set(key, value);
	}

	async delete(key: string): Promise<void> {
		await this.store.delete(key);
	}
}
