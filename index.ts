import { Application } from "./src/server";

export { Request } from "./src/request";
export { Response } from "./src/response";

export default function harpia(): Application {
	return Application.getInstance();
}
