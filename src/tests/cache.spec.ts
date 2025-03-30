import { beforeEach, describe, expect, it } from "bun:test";
import { Cache } from "../cache";
import { MemoryStore } from "../memory-store";
import type { Store } from "../types/store";

describe("Cache", () => {
  let cache: Cache;
  let mockStore: Store;

  beforeEach(() => {
    mockStore = new MemoryStore(); // Initialize with MemoryStore for each test
    cache = new Cache({ store: mockStore });
  });

  it("should set and get a value", async () => {
    const key = "myKey";
    const value = { data: "myValue" };

    await cache.set(key, value);
    const retrievedValue = await cache.get(key);

    expect(retrievedValue).toEqual(value);
  });

  it("should return undefined when getting a non-existent key", async () => {
    const key = "nonExistentKey";
    const retrievedValue = await cache.get(key);

    expect(retrievedValue).toBeUndefined();
  });

  it("should delete a key", async () => {
    const key = "keyToDelete";
    const value = "someValue";

    await cache.set(key, value);
    await cache.delete(key);
    const retrievedValue = await cache.get(key);

    expect(retrievedValue).toBeUndefined();
  });

  it("should use MemoryStore by default if no store is provided", async () => {
    const defaultCache = new Cache();
    const key = "defaultKey";
    const value = "defaultValue";

    await defaultCache.set(key, value);
    const retrievedValue = await defaultCache.get(key);

    expect(retrievedValue).toEqual(value);
  });

  it("should set multiple values correctly", async () => {
    const data = [
      { key: "key1", value: "value1" },
      { key: "key2", value: { nested: "value2" } },
      { key: "key3", value: 123 },
    ];
    for (const item of data) {
      await cache.set(item.key, item.value);
    }

    for (const item of data) {
      const retrievedValue = await cache.get(item.key);
      expect(retrievedValue).toEqual(item.value);
    }
  });

  it("should handle deletion of multiple keys", async () => {
    const keys = ["keyA", "keyB", "keyC"];
    const value = "value";

    for (const key of keys) {
      await cache.set(key, value);
    }

    for (const key of keys) {
      await cache.delete(key);
    }

    for (const key of keys) {
      const retrievedValue = await cache.get(key);
      expect(retrievedValue).toBeUndefined();
    }
  });

  it("should handle null and undefined values", async () => {
    await cache.set("nullKey", null);
    await cache.set("undefinedKey", undefined);

    expect(await cache.get("nullKey")).toBeNull();
    expect(await cache.get("undefinedKey")).toBeUndefined();
  });
});
