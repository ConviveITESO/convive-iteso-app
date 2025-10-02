import process from "node:process";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigSchema } from "../config/config.schema";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";

@Injectable()
export class HealthService {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly configService: ConfigService<ConfigSchema>,
	) {}

	/**
	 * Get basic health status
	 * @returns Basic health information
	 */
	getHealthStatus() {
		const version = this.configService.getOrThrow("APP_VERSION");
		const environment = this.configService.getOrThrow("NODE_ENV");

		return {
			status: "ok",
			service: "ConviveITESO API",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version,
			environment,
		};
	}

	/**
	 * Check database connection health
	 * @returns Database health status
	 */
	async checkDatabaseHealth() {
		try {
			// Simple query to check database connectivity
			await this.db.execute("SELECT 1");
			return {
				status: "connected",
				type: "postgresql",
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Database connection failed: ${errorMessage}`);
		}
	}
}
