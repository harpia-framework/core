import { describe, expect, it } from "bun:test";
import { Request } from "../request";

describe("Request", () => {
  it("should extract params correctly", () => {
    const req = new Request(
      "http://example.com/users/123/posts/456",
      {},
      "http://example.com/users/123/posts/456",
      "/users/:userId/posts/:postId",
      "GET",
    );
    expect(req.params).toEqual({ userId: "123", postId: "456" });
  });

  it("should extract query parameters correctly", () => {
    const req = new Request(
      "http://example.com/search?q=test&page=2",
      {},
      "http://example.com/search?q=test&page=2",
      "/search",
      "GET",
    );
    expect(req.query).toEqual({ q: "test", page: "2" });
  });

  it("should handle empty params", () => {
    const req = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "GET");
    expect(req.params).toEqual({});
  });

  it("should handle empty query", () => {
    const req = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "GET");
    expect(req.query).toEqual({});
  });

  it("should handle mixed params and query", () => {
    const req = new Request(
      "http://example.com/users/123/posts/456?q=test&page=2",
      {},
      "http://example.com/users/123/posts/456?q=test&page=2",
      "/users/:userId/posts/:postId",
      "GET",
    );
    expect(req.params).toEqual({ userId: "123", postId: "456" });
    expect(req.query).toEqual({ q: "test", page: "2" });
  });

  it("should handle different HTTP methods", () => {
    const getReq = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "GET");
    expect(getReq.method).toBe("GET");

    const postReq = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "POST");
    expect(postReq.method).toBe("POST");

    const putReq = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "PUT");
    expect(putReq.method).toBe("PUT");

    const deleteReq = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "DELETE");
    expect(deleteReq.method).toBe("DELETE");
  });

  it("should handle cookies", () => {
    const headers = new Headers({ Cookie: "name=value; other=test" });
    const req = new Request("http://example.com/users", { headers }, "http://example.com/users", "/users", "GET");

    expect(req.cookies.get("name")).toBe("value");
    expect(req.cookies.get("other")).toBe("test");
    expect(req.cookies.get("missing")).toBeUndefined();

    expect(req.cookies.getAll()).toEqual({ name: "value", other: "test" });
  });

  it("should handle no cookies", () => {
    const req = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "GET");
    expect(req.cookies.get("name")).toBeUndefined();
    expect(req.cookies.getAll()).toEqual({});
  });

  it("should handle route with only one param", () => {
    const req = new Request(
      "http://example.com/users/123",
      {},
      "http://example.com/users/123",
      "/users/:userId",
      "GET",
    );
    expect(req.params).toEqual({ userId: "123" });
  });

  it("should handle route with no params", () => {
    const req = new Request("http://example.com/users", {}, "http://example.com/users", "/users", "GET");
    expect(req.params).toEqual({});
  });

  it("should handle route with only one query", () => {
    const req = new Request(
      "http://example.com/search?q=test",
      {},
      "http://example.com/search?q=test",
      "/search",
      "GET",
    );
    expect(req.query).toEqual({ q: "test" });
  });

  it("should handle route with no query", () => {
    const req = new Request("http://example.com/search", {}, "http://example.com/search", "/search", "GET");
    expect(req.query).toEqual({});
  });
});
