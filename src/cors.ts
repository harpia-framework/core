import type { Response } from "./response";
import type { CorsOptions } from "./types/cors";
import type { MethodOptions } from "./types/router";

export class Cors {
  public options: CorsOptions | null;

  constructor() {
    this.options = null;
  }

  public setCors(req: Request, res: Response, next: () => void): boolean {
    return this.handleCors(req, res, next);
  }

  private handleCors(req: Request, res: Response, next: () => void): boolean {
    const reqOrigin = req.headers.get("Origin");

    if (this.options) {
      const {
        origin,
        methods,
        allowedHeaders,
        exposedHeaders,
        credentials,
        maxAge,
        preflightContinue,
        optionsSuccessStatus,
      } = this.options;

      if (!this.isOriginAllowed(origin, reqOrigin, res)) return false;
      if (!this.isMethodAllowed(methods, req.method, res)) return false;

      this.allowHeaders(allowedHeaders, res);
      this.exposeHeaders(exposedHeaders, res);
      this.addCredentials(credentials, res);
      this.addMaxAge(maxAge, res);

      if (req.method === "OPTIONS") {
        const isPreflightAllowed = this.handlePreflight(preflightContinue, optionsSuccessStatus, res);

        if (!isPreflightAllowed) {
          return false;
        }

        next();
        return true;
      }
    }

    return true;
  }

  private isOriginAllowed(origin: CorsOptions["origin"], reqOrigin: string | null, res: Response): boolean {
    if (origin === false) {
      res.status(403).send("Origin Not Allowed");
      return false;
    }

    if (origin) {
      return this.handleOrigin(reqOrigin, res);
    }

    return true;
  }

  private handleOrigin(reqOrigin: string | null, res: Response): boolean {
    if (this.options) {
      if (!this.options.origin) {
        return true;
      }

      if (typeof this.options.origin === "boolean") {
        if (this.options.origin === true) {
          res.headers.set("Access-Control-Allow-Origin", "*");
          return true;
        }

        if (this.options.origin === false) {
          res.status(403).send("Origin Not Allowed");
          return false;
        }

        if (!reqOrigin) {
          res.status(403).send("Origin Not Allowed");
          return false;
        }
      }

      if (typeof this.options.origin === "string") {
        const isAllowed = this.options.origin === reqOrigin;

        if (isAllowed) {
          res.headers.set("Access-Control-Allow-Origin", this.options.origin);
        } else {
          res.status(403).send("Origin Not Allowed");
        }

        return isAllowed;
      }

      if (this.options.origin instanceof RegExp) {
        if (reqOrigin) {
          const isAllowed = (this.options.origin as RegExp).test(reqOrigin);

          if (isAllowed) {
            res.headers.set("Access-Control-Allow-Origin", reqOrigin);
          } else {
            res.status(403).send("Origin Not Allowed");
          }

          return isAllowed;
        }

        return false;
      }

      if (Array.isArray(this.options.origin)) {
        if (reqOrigin) {
          const isAllowed = (this.options.origin as Array<string | RegExp>).some((item) => {
            const isString = typeof item === "string" && item === reqOrigin;
            const isRegex = item instanceof RegExp && item.test(reqOrigin);

            return isString || isRegex;
          });

          if (isAllowed) {
            res.headers.set("Access-Control-Allow-Origin", reqOrigin);
          } else {
            res.status(403).send("Origin Not Allowed");
          }

          return isAllowed;
        }

        return false;
      }

      if (typeof this.options.origin === "function") {
        const func = this.options.origin as Function;
        let resultAllowed = false;

        func(reqOrigin, (err?: Error, resultOrigin?: string) => {
          if (err) {
            res.status(500).send(err.message);
          }

          if (resultOrigin) {
            res.headers.set("Access-Control-Allow-Origin", resultOrigin);
            resultAllowed = true;
          } else {
            res.status(403).send("Origin Not Allowed");
          }
        });

        return resultAllowed;
      }
    }

    return true;
  }

  private isMethodAllowed(methods: CorsOptions["methods"], reqMethod: string, res: Response): boolean {
    if (methods && !this.handleMethods(reqMethod as MethodOptions, methods)) {
      res.status(405).send("Method Not Allowed");
      return false;
    }

    return true;
  }

  private handleMethods(method: MethodOptions, allowedMethods: CorsOptions["methods"]): boolean {
    if (allowedMethods === "*") {
      return true;
    }

    if (Array.isArray(allowedMethods) || typeof allowedMethods === "string") {
      return allowedMethods.includes(method);
    }

    return true;
  }

  private allowHeaders(allowedHeaders: CorsOptions["allowedHeaders"], res: Response): void {
    if (allowedHeaders) {
      const isArray = Array.isArray(allowedHeaders);
      res.headers.set("Access-Control-Allow-Headers", isArray ? allowedHeaders.join(",") : allowedHeaders);
    }
  }

  private exposeHeaders(exposedHeaders: CorsOptions["exposedHeaders"], res: Response): void {
    if (exposedHeaders) {
      const isArray = Array.isArray(exposedHeaders);
      res.headers.set("Access-Control-Expose-Headers", isArray ? exposedHeaders.join(",") : exposedHeaders);
    }
  }

  private addCredentials(credentials: CorsOptions["credentials"], res: Response): void {
    if (credentials) {
      res.headers.set("Access-Control-Allow-Credentials", String(credentials));
    }
  }

  private addMaxAge(maxAge: CorsOptions["maxAge"], res: Response): void {
    if (maxAge) {
      res.headers.set("Access-Control-Max-Age", maxAge.toString());
    }
  }

  private handlePreflight(
    preflightContinue: CorsOptions["preflightContinue"],
    optionsSuccessStatus: CorsOptions["optionsSuccessStatus"],
    res: Response,
  ): boolean {
    if (!preflightContinue) {
      res.status(optionsSuccessStatus || 204).send("");
      return false;
    }

    return true;
  }
}
