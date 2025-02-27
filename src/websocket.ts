import type { ServerWebSocket } from "bun";
import type { WebSocketOptions } from "./types/server";

export type WebSocketData<T = {}> = T;
type InternalWebSocketData<T> = { url: string } & WebSocketData<T>;

export type WebSocketHandlers<T = {}> = {
  open?: (ws: ServerWebSocket<InternalWebSocketData<T>>) => void | Promise<void>;
  message?: (ws: ServerWebSocket<InternalWebSocketData<T>>, message: string | Buffer) => void | Promise<void>;
  close?: (ws: ServerWebSocket<InternalWebSocketData<T>>, code: number, reason: string) => void | Promise<void>;
  drain?: (ws: ServerWebSocket<InternalWebSocketData<T>>) => void | Promise<void>;
  error?: (ws: ServerWebSocket<InternalWebSocketData<T>>, error: Error) => void | Promise<void>;
};

export type WebSocketRoutes<T = any> = {
  path: string;
  handler: WebSocketHandlers<T>;
};

export class WebSocket<T = any> {
  private routes: WebSocketRoutes<T>[];
  private connections: Set<ServerWebSocket<InternalWebSocketData<T>>>;

  constructor() {
    this.routes = [];
    this.connections = new Set();
  }

  public register(path: string, handler: WebSocketHandlers<T>): void {
    this.routes.push({ path, handler });
  }

  public list(): WebSocketRoutes[] {
    return this.routes;
  }

  public get(path: string): WebSocketRoutes | undefined {
    return this.routes.find((route) => route.path === path);
  }

  public isRouteMatching(url: string): WebSocketRoutes | null {
    const urlSegments = url.split("/").filter(Boolean);

    for (const route of this.routes) {
      const routeSegments = route.path.split("/").filter(Boolean);

      if (urlSegments.length !== routeSegments.length) {
        continue;
      }

      const isSegmentMatching = routeSegments.every((segment, index) => {
        return segment.startsWith(":") || segment === urlSegments[index];
      });

      if (isSegmentMatching) {
        return route;
      }
    }

    return null;
  }

  public all(): WebSocketOptions<InternalWebSocketData<T>> {
    return {
      message: (ws, message) => {
        const pathname = new URL(ws.data.url).pathname;
        const route = this.isRouteMatching(pathname);

        if (route?.handler.message) {
          route.handler.message(ws, message);

          for (const connection of this.connections) {
            if (connection !== ws && connection.readyState === 1) {
              connection.send(`${message}`);
            }
          }
        }
      },
      open: (ws) => {
        const pathname = new URL(ws.data.url).pathname;
        const route = this.isRouteMatching(pathname);

        if (route?.handler.open) {
          this.connections.add(ws);
          route.handler.open(ws);
        } else {
          ws.close(1003, "Route not allowed");
        }
      },
      close: (ws, code, message) => {
        const pathname = new URL(ws.data.url).pathname;
        const route = this.isRouteMatching(pathname);

        if (route?.handler.close) {
          this.connections.delete(ws);
          route.handler.close(ws, code, message);
        }
      },
      drain: (ws) => {
        const pathname = new URL(ws.data.url).pathname;
        const route = this.isRouteMatching(pathname);

        if (route?.handler.drain) {
          route.handler.drain(ws);
        }
      },
      error: (ws, error) => {
        const pathname = new URL(ws.data.url).pathname;
        const route = this.isRouteMatching(pathname);

        if (route?.handler.error) {
          route.handler.error(ws, error);
        }
      },
    };
  }
}
