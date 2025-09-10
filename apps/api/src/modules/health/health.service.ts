import process from "node:process";
import { Inject, Injectable } from "@nestjs/common";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";

@Injectable()
export class HealthService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * Get basic health status
	 * @returns Basic health information
	 */
	getHealthStatus() {
		return {
			status: "ok",
			service: "ConviveITESO API",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version: process.env.npm_package_version || "1.0.0",
			environment: process.env.NODE_ENV || "development",
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
