import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	/**
	 * Basic health check endpoint
	 * Returns 200 OK if the service is running
	 */
	@Get()
	getHealth() {
		return this.healthService.getHealthStatus();
	}

	/**
	 * Database health check endpoint
	 * Returns 200 OK if database connection is healthy
	 */
	@Get("db")
	async getDatabaseHealth() {
		try {
			const dbHealth = await this.healthService.checkDatabaseHealth();
			return {
				status: "ok",
				database: dbHealth,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			return {
				status: "error",
				database: { status: "down", error: errorMessage },
				timestamp: new Date().toISOString(),
			};
		}
	}
}
