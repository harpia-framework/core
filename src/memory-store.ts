import type { Store } from "./types/store";

export class MemoryStore implements Store {
  private store: Map<string, any>;
  private lock: Promise<void>;

  constructor() {
    this.store = new Map();
    this.lock = Promise.resolve();
  }

  public async get(key: string): Promise<any> {
    await this.lock;
    return this.store.get(key);
  }

  public async set(key: string, value: any): Promise<void> {
    this.lock = this.lock.then(() => {
      this.store.set(key, value);
    });
    await this.lock;
  }

  async delete(sessionId: string): Promise<void> {
    await this.lock;
    this.store.delete(sessionId);
  }
}
