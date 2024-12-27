export class Application {
  private static instance: Application | null = null;

  private constructor() {}

  public static getInstance(): Application {
    if (!this.instance) {
      this.instance = new Application();
    }

    return this.instance;
  }

  public listen(port: number, handler: () => void) {
    Bun.serve({
      port,
      fetch(req) {
        return new Response("Hello");
      }
    });

    if (handler) {
      handler();
    }
  }
}