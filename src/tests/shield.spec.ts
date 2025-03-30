import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Response } from "../response";
import { Shield } from "../shield";

describe("Shield", () => {
  let shield: Shield;
  let response: Response;

  beforeEach(() => {
    shield = new Shield();
    response = new Response();
  });

  it("should create a Shield instance with default headers", () => {
    expect((shield as any).headers).toEqual({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "base-uri": ["'self'"],
          "font-src": ["'self'", "https:", "data:"],
          "form-action": ["'self'"],
          "frame-ancestors": ["'self'"],
          "img-src": ["'self'", "data:"],
          "object-src": ["'none'"],
          "script-src": ["'self'"],
          "script-src-attr": ["'none'"],
          "style-src": ["'self'", "https:", "'unsafe-inline'"],
          "upgrade-insecure-requests": [],
        },
      },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      originAgentCluster: true,
      referrerPolicy: { policy: "no-referrer" },
      strictTransportSecurity: { maxAge: 15552000, includeSubDomains: true },
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      xDownloadOptions: true,
      xFrameOptions: { action: "SAMEORIGIN" },
      xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
      xPoweredBy: false,
      xXssProtection: false,
    });
  });

  it("should create a Shield instance with custom headers", () => {
    const customHeaders = {
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'none'"],
        },
      },
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
      xPoweredBy: true,
      xXssProtection: true,
    };

    shield = new Shield(customHeaders);

    expect((shield as any).headers).toEqual({
      contentSecurityPolicy: { directives: { "default-src": ["'none'"] } },
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      originAgentCluster: true,
      referrerPolicy: { policy: "no-referrer" },
      strictTransportSecurity: { maxAge: 15552000, includeSubDomains: true },
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      xDownloadOptions: true,
      xFrameOptions: { action: "SAMEORIGIN" },
      xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
      xPoweredBy: true,
      xXssProtection: true,
    });
  });

  it("should apply Content-Security-Policy header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests",
    );
  });

  it("should apply Cross-Origin-Opener-Policy header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("should apply Cross-Origin-Resource-Policy header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("should apply Origin-Agent-Cluster header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Origin-Agent-Cluster")).toBe("?1");
  });

  it("should apply Referrer-Policy header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("should apply Strict-Transport-Security header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=15552000; includeSubDomains");
  });

  it("should apply X-Content-Type-Options header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("should apply X-DNS-Prefetch-Control header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-DNS-Prefetch-Control")).toBe("off");
  });

  it("should apply X-Download-Options header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-Download-Options")).toBe("noopen");
  });

  it("should apply X-Frame-Options header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("should apply X-Permitted-Cross-Domain-Policies header", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toBe("none");
  });

  it("should delete X-Powered-By header", () => {
    response.headers.set("X-Powered-By", "Express");
    (shield as any).applyHeaders(response);
    expect(response.headers.has("X-Powered-By")).toBe(false);
  });

  it("should set X-XSS-Protection to 0", () => {
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-XSS-Protection")).toBe("0");
  });

  it("should apply headers with middleware", () => {
    const middleware = shield.middleware();
    const next = mock();
    middleware({} as any, response, next);
    expect(response.headers.get("Content-Security-Policy")).toBeDefined();
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBeDefined();
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBeDefined();
    expect(response.headers.get("Origin-Agent-Cluster")).toBeDefined();
    expect(response.headers.get("Referrer-Policy")).toBeDefined();
    expect(response.headers.get("Strict-Transport-Security")).toBeDefined();
    expect(response.headers.get("X-Content-Type-Options")).toBeDefined();
    expect(response.headers.get("X-DNS-Prefetch-Control")).toBeDefined();
    expect(response.headers.get("X-Download-Options")).toBeDefined();
    expect(response.headers.get("X-Frame-Options")).toBeDefined();
    expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toBeDefined();
    expect(response.headers.has("X-Powered-By")).toBe(false);
    expect(response.headers.get("X-XSS-Protection")).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("should handle boolean false for contentSecurityPolicy", () => {
    const customHeaders = {
      contentSecurityPolicy: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("Content-Security-Policy")).toBe(false);
  });

  it("should handle boolean false for crossOriginOpenerPolicy", () => {
    const customHeaders = {
      crossOriginOpenerPolicy: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("Cross-Origin-Opener-Policy")).toBe(false);
  });

  it("should handle boolean false for crossOriginResourcePolicy", () => {
    const customHeaders = {
      crossOriginResourcePolicy: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("Cross-Origin-Resource-Policy")).toBe(false);
  });

  it("should handle boolean false for referrerPolicy", () => {
    const customHeaders = {
      referrerPolicy: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("Referrer-Policy")).toBe(false);
  });

  it("should handle boolean false for strictTransportSecurity", () => {
    const customHeaders = {
      strictTransportSecurity: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("Strict-Transport-Security")).toBe(false);
  });

  it("should handle boolean false for xDnsPrefetchControl", () => {
    const customHeaders = {
      xDnsPrefetchControl: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("X-DNS-Prefetch-Control")).toBe(false);
  });

  it("should handle boolean false for xFrameOptions", () => {
    const customHeaders = {
      xFrameOptions: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("X-Frame-Options")).toBe(false);
  });

  it("should handle boolean false for xPermittedCrossDomainPolicies", () => {
    const customHeaders = {
      xPermittedCrossDomainPolicies: false,
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.has("X-Permitted-Cross-Domain-Policies")).toBe(false);
  });

  it("should handle custom referrerPolicy array", () => {
    const customHeaders = {
      referrerPolicy: { policy: ["origin", "unsafe-url"] },
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Referrer-Policy")).toBe("origin, unsafe-url");
  });

  it("should handle custom strictTransportSecurity", () => {
    const customHeaders = {
      strictTransportSecurity: { maxAge: 31536000, includeSubDomains: false, preload: true },
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000; preload");
  });

  it("should handle custom xDnsPrefetchControl", () => {
    const customHeaders = {
      xDnsPrefetchControl: { allow: true },
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-DNS-Prefetch-Control")).toBe("on");
  });

  it("should handle custom xFrameOptions", () => {
    const customHeaders = {
      xFrameOptions: { action: "DENY" },
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("should handle custom xPermittedCrossDomainPolicies", () => {
    const customHeaders = {
      xPermittedCrossDomainPolicies: { permittedPolicies: "master-only" },
    };
    shield = new Shield(customHeaders);
    (shield as any).applyHeaders(response);
    expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toBe("master-only");
  });
});
