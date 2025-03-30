import { beforeEach, describe, expect, it } from "bun:test";
import { Middleware } from "../middlewares";
import type { Handler } from "../types/handler";

describe("Middleware", () => {
  let middleware: Middleware;

  beforeEach(() => {
    middleware = new Middleware();
  });

  it("should add a middleware", () => {
    const handler: Handler = (_req, _res, next) => {
      next();
    };
    middleware.set("/api", handler);
    const allMiddlewares = middleware.all();
    expect(allMiddlewares).toHaveLength(1);
    expect(allMiddlewares[0].path).toBe("/api");
    expect(allMiddlewares[0].handler).toBe(handler);
  });

  it("should return all middlewares", () => {
    const handler1: Handler = (_req, _res, next) => {
      next();
    };
    const handler2: Handler = (_req, _res, next) => {
      next();
    };
    middleware.set("/api", handler1);
    middleware.set("/users", handler2);
    const allMiddlewares = middleware.all();
    expect(allMiddlewares).toHaveLength(2);
    expect(allMiddlewares[0].path).toBe("/api");
    expect(allMiddlewares[0].handler).toBe(handler1);
    expect(allMiddlewares[1].path).toBe("/users");
    expect(allMiddlewares[1].handler).toBe(handler2);
  });

  it("should find matching middlewares for a specific path", () => {
    const handler1: Handler = (_req, _res, next) => {
      next();
    };
    const handler2: Handler = (_req, _res, next) => {
      next();
    };
    const handler3: Handler = (_req, _res, next) => {
      next();
    };
    middleware.set("/api", handler1);
    middleware.set("/api/users", handler2);
    middleware.set("*", handler3); // Global Middleware
    const matchingMiddlewares = middleware.isMiddlewareMatching("/api/users/123");
    expect(matchingMiddlewares).toHaveLength(3);
    expect(matchingMiddlewares[0]).toBe(handler1);
    expect(matchingMiddlewares[1]).toBe(handler2);
    expect(matchingMiddlewares[2]).toBe(handler3);
  });

  it("should find matching middlewares for a root path", () => {
    const handler1: Handler = (_req, _res, next) => {
      next();
    };
    const handler2: Handler = (_req, _res, next) => {
      next();
    };

    middleware.set("/", handler1);
    middleware.set("*", handler2);

    const matchingMiddlewares = middleware.isMiddlewareMatching("/");
    expect(matchingMiddlewares).toHaveLength(2);
    expect(matchingMiddlewares[0]).toBe(handler1);
    expect(matchingMiddlewares[1]).toBe(handler2);
  });

  it("should not return any middlewares if no match is found", () => {
    const handler1: Handler = (_req, _res, next) => {
      next();
    };
    const handler2: Handler = (_req, _res, next) => {
      next();
    };
    middleware.set("/api", handler1);
    middleware.set("/users", handler2);
    const matchingMiddlewares = middleware.isMiddlewareMatching("/products");
    expect(matchingMiddlewares).toHaveLength(0);
  });

  it("should match global middleware", () => {
    const handler: Handler = (_req, _res, next) => {
      next();
    };
    middleware.set("*", handler);
    const matchingMiddlewares = middleware.isMiddlewareMatching("/any/path");
    expect(matchingMiddlewares).toHaveLength(1);
    expect(matchingMiddlewares[0]).toBe(handler);
  });

  it("should handle multiple global middlewares", () => {
    const handler1: Handler = (_req, _res, next) => {
      next();
    };
    const handler2: Handler = (_req, _res, next) => {
      next();
    };

    middleware.set("*", handler1);
    middleware.set("*", handler2);
    const matchingMiddlewares = middleware.isMiddlewareMatching("/any/route");
    expect(matchingMiddlewares).toHaveLength(2);
    expect(matchingMiddlewares[0]).toBe(handler1);
    expect(matchingMiddlewares[1]).toBe(handler2);
  });

  it("should return an empty array if no middlewares are set", () => {
    const matchingMiddlewares = middleware.isMiddlewareMatching("/some/path");
    expect(matchingMiddlewares).toHaveLength(0);
  });
});
