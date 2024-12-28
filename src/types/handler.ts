import type { Request } from "../request";
import type { Response } from "../response";

export type Handler = (req: Request, response: Response, next: () => void) => void | Promise<void>;
