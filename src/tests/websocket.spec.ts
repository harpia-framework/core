import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ServerWebSocket } from "bun";
import { WebSocket } from "../websocket";

describe("WebSocket", () => {
  let ws: WebSocket;
  const mockWs = (url: string): ServerWebSocket<any> =>
    ({
      data: { url },
      readyState: 1,
      send: mock(() => {}),
      close: mock(() => {}),
      subscribe: mock(() => {}),
      unsubscribe: mock(() => {}),
      publish: mock(() => {}),
      isSubscribed: mock(() => true),
    }) as any;

  beforeEach(() => {
    ws = new WebSocket();
  });

  describe("Core Functionality", () => {
    test("should initialize with empty state", () => {
      expect(ws.list()).toEqual([]);
      expect(ws["connections"].size).toBe(0);
    });

    test("should register routes", () => {
      const handler = { open: mock(() => {}) };
      ws.register("/chat", handler);
      expect(ws.list()).toHaveLength(1);
    });
  });

  describe("Route Matching", () => {
    beforeEach(() => {
      ws.register("/chat", {});
      ws.register("/user/:id", {});
    });

    test("should find exact path", () => {
      expect(ws.get("/chat")).toBeDefined();
    });

    test("should match parameterized routes", () => {
      expect(ws.isRouteMatching("/user/123")).toMatchObject({ path: "/user/:id" });
    });

    test("should reject invalid paths", () => {
      expect(ws.isRouteMatching("/invalid")).toBeNull();
    });
  });

  describe("Connection Handling", () => {
    test("should accept valid connections", () => {
      const handler = { open: mock(() => {}) };
      ws.register("/chat", handler);
      const wsInstance = mockWs("ws://localhost/chat");

      ws.all().open(wsInstance);
      expect(handler.open).toHaveBeenCalled();
      expect(ws["connections"].size).toBe(1);
    });

    test("should reject invalid routes", () => {
      const wsInstance = mockWs("ws://localhost/invalid");
      ws.all().open(wsInstance);
      expect(wsInstance.close).toHaveBeenCalledWith(1003, "Route not allowed");
    });
  });

  describe("Message Handling", () => {
    test("should process messages", () => {
      const handler = { message: mock(() => {}) };
      ws.register("/chat", handler);
      const wsInstance = mockWs("ws://localhost/chat");

      ws.all().message(wsInstance, "test");
      expect(handler.message).toHaveBeenCalled();
    });

    test("should broadcast messages", () => {
      const handler = { message: mock(() => {}) };
      ws.register("/chat", handler);
      const ws1 = mockWs("ws://localhost/chat");
      const ws2 = mockWs("ws://localhost/chat");

      ws["connections"].add(ws1);
      ws["connections"].add(ws2);
      ws.all().message(ws1, "hello");

      expect(ws2.send).toHaveBeenCalledWith("hello");
    });
  });

  describe("Lifecycle Events", () => {
    test("should handle close events", () => {
      const handler = { close: mock(() => {}) };
      ws.register("/chat", handler);
      const wsInstance = mockWs("ws://localhost/chat");

      ws["connections"].add(wsInstance);
      ws.all().close(wsInstance, 1000, "Normal");

      expect(handler.close).toHaveBeenCalled();
      expect(ws["connections"].size).toBe(0);
    });

    test("should handle drain events", () => {
      const handler = { drain: mock(() => {}) };
      ws.register("/chat", handler);
      const wsInstance = mockWs("ws://localhost/chat");

      ws.all().drain(wsInstance);
      expect(handler.drain).toHaveBeenCalled();
    });

    test("should handle errors", () => {
      const handler = { error: mock(() => {}) };
      ws.register("/chat", handler);
      const wsInstance = mockWs("ws://localhost/chat");
      const testError = new Error("test");

      ws.all().error(wsInstance, testError);
      expect(handler.error).toHaveBeenCalledWith(wsInstance, testError);
    });
  });

  describe("Type Safety", () => {
    test("should support custom data types", () => {
      interface UserData {
        id: string;
      }
      const typedWs = new WebSocket<UserData>();
      const handler = {
        open: mock((ws: ServerWebSocket<{ url: string; id: string }>) => {
          ws.data.id = "123"; // Type checked
        }),
      };

      typedWs.register("/user", handler);
      const wsInstance = mockWs("ws://localhost/user");
      typedWs.all().open(wsInstance);

      expect(handler.open).toHaveBeenCalled();
    });
  });
});
