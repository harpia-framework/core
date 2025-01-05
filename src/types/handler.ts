import type { Request } from "../request";
import type { Response } from "../response";

export type HandlerResult = Response | void;
export type Handler = (req: Request, response: Response, next: () => void) => HandlerResult | Promise<HandlerResult>;
