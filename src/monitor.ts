import { MemoryStore } from "./memory-store";
import type { MonitorInterface, TrafficSource, VisitorData } from "./types/monitor";
import type { Store } from "./types/store";

const monitor: MonitorInterface = {
	access: {
		visitorsByDate: new Map<string, Map<string, VisitorData>>(),
		totalRequests: 0,
	},
	behavior: {
		pageViews: new Map<string, number>(),
	},
};

export class RequestMonitor {
	private request: Request | null = null;
	private clientIp: string | null = null;
	private trafficSource: TrafficSource | null = null;
	private store: Store;

	constructor(store?: Store) {
		this.store = store || new MemoryStore();
	}

	/**
	 * Initializes the Monitor instance with request data.
	 */
	public initialize(request: Request, clientIp: string, trafficSource?: TrafficSource): void {
		this.request = request;
		this.clientIp = clientIp;
		this.trafficSource = trafficSource || null;
	}

	/**
	 * Converts a Map to a plain object.
	 * Handles nested Maps recursively.
	 */
	private mapToObject<K extends string | number | symbol, V>(map: Map<K, V>): Record<K, V> {
		const obj = {} as Record<K, V>;
		for (const [key, value] of map.entries()) {
			if (value instanceof Map) {
				obj[key] = this.mapToObject(value) as any;
			} else {
				obj[key] = value;
			}
		}
		return obj;
	}

	/**
	 * Extracts the client's IP address from the request headers.
	 */
	private getClientIp(): string {
		if (!this.request || !this.clientIp) {
			throw new Error("Monitor not initialized with request data");
		}

		const headers = this.request.headers;
		const ipFromHeaders =
			headers.get("x-forwarded-for")?.split(",")[0] || headers.get("cf-connecting-ip") || headers.get("x-real-ip");

		const ipFromSocket = this.clientIp || "unknown";
		return ipFromHeaders || ipFromSocket;
	}

	/**
	 * Saves the current metrics to the store.
	 */
	private async saveMetrics(): Promise<void> {
		const metrics = {
			access: {
				visitorsByDate: this.mapToObject(monitor.access.visitorsByDate),
				totalRequests: monitor.access.totalRequests,
			},
			behavior: {
				pageViews: this.mapToObject(monitor.behavior.pageViews),
			},
		};
		await this.store.set("metrics", metrics);
	}

	/**
	 * Retrieves the saved metrics from the store.
	 */
	public async getMetrics(): Promise<any> {
		return await this.store.get("metrics");
	}

	/**
	 * Handles an incoming HTTP request.
	 */
	public async handleRequest(): Promise<Response | void> {
		if (!this.request || !this.clientIp) {
			throw new Error("Monitor not initialized with request data");
		}

		try {
			const url = new URL(this.request.url);
			const path = url.pathname;

			if (path === "/favicon.ico") {
				return new Response(null, { status: 204 }); // No Content
			}

			const startTime = Date.now();
			const clientIp = this.getClientIp();
			const timestamp = new Date().toISOString();
			const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

			if (!monitor.access.visitorsByDate.has(dateKey)) {
				monitor.access.visitorsByDate.set(dateKey, new Map<string, VisitorData>());
			}

			const dailyVisitors = monitor.access.visitorsByDate.get(dateKey)!;

			if (!dailyVisitors.has(clientIp)) {
				dailyVisitors.set(clientIp, {
					totalRequests: 0,
					pagesVisited: [],
					responseTimes: [],
					errors: 0,
				});
			}

			const visitorData = dailyVisitors.get(clientIp)!;

			// Update access metrics
			visitorData.totalRequests++;
			visitorData.pagesVisited.push({
				path,
				timestamp,
				trafficSource: this.trafficSource || undefined,
			});
			monitor.access.totalRequests++;

			// Update behavior metrics
			monitor.behavior.pageViews.set(path, (monitor.behavior.pageViews.get(path) || 0) + 1);

			const endTime = Date.now();
			const responseTime = endTime - startTime;
			visitorData.responseTimes.push(responseTime);

			await this.saveMetrics();
		} catch (error) {
			const clientIp = this.getClientIp();
			const dateKey = new Date().toISOString().split("T")[0];

			if (monitor.access.visitorsByDate.has(dateKey)) {
				const dailyVisitors = monitor.access.visitorsByDate.get(dateKey)!;
				if (dailyVisitors.has(clientIp)) {
					dailyVisitors.get(clientIp)!.errors++;
				}
			}

			await this.saveMetrics();

			return new Response(JSON.stringify({ error: "An error occurred on the server" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	}
}

export const Monitor = new RequestMonitor();
