import { beforeEach, describe, expect, it } from "bun:test";
import { MemoryStore } from "../memory-store";

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it("should be able to set and get a session", async () => {
    const sessionId = "test-session";
    const data = { user: "testuser", role: "admin" };

    await store.set(sessionId, data);
    const retrievedData = await store.get(sessionId);

    expect(retrievedData).toEqual(data);
  });

  it("should return undefined if a session does not exist", async () => {
    const sessionId = "nonexistent-session";
    const retrievedData = await store.get(sessionId);

    expect(retrievedData).toBeUndefined();
  });

  it("should be able to delete a session", async () => {
    const sessionId = "test-session";
    const data = { user: "testuser" };

    await store.set(sessionId, data);
    await store.delete(sessionId);
    const retrievedData = await store.get(sessionId);

    expect(retrievedData).toBeUndefined();
  });

  it("should handle setting multiple sessions", async () => {
    const session1Id = "session-1";
    const session1Data = { user: "user1" };
    const session2Id = "session-2";
    const session2Data = { user: "user2" };

    await store.set(session1Id, session1Data);
    await store.set(session2Id, session2Data);

    const retrievedSession1 = await store.get(session1Id);
    const retrievedSession2 = await store.get(session2Id);

    expect(retrievedSession1).toEqual(session1Data);
    expect(retrievedSession2).toEqual(session2Data);

    await store.delete(session1Id);
    const retrievedSession1Deleted = await store.get(session1Id);
    expect(retrievedSession1Deleted).toBeUndefined();
    expect(await store.get(session2Id)).toEqual(session2Data);
  });

  it("should handle empty data", async () => {
    const sessionId = "empty-session";
    const emptyData = {};

    await store.set(sessionId, emptyData);
    const retrievedData = await store.get(sessionId);

    expect(retrievedData).toEqual(emptyData);
  });

  it("should handle different data types", async () => {
    const sessionId = "mixed-data-session";
    const mixedData = {
      number: 123,
      string: "hello",
      boolean: true,
      array: [1, 2, 3],
      object: { key: "value" },
    };

    await store.set(sessionId, mixedData);
    const retrievedData = await store.get(sessionId);

    expect(retrievedData).toEqual(mixedData);
  });
});
