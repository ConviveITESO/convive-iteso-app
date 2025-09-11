import process from "node:process";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
	private readonly logger = new Logger(DatabaseHealthService.name);

	constructor(private readonly configService: ConfigService) {}

	async onModuleInit() {
		await this.checkDatabaseConnection();
	}

	private async checkDatabaseConnection(): Promise<void> {
		const databaseUrl = this.configService.getOrThrow("DATABASE_URL");
		const pool = new Pool({
			connectionString: databaseUrl,
		});

		try {
			this.logger.log("Testing database connection...");

			// Test the connection with a simple query
			const client = await pool.connect();
			await client.query("SELECT 1");
			client.release();

			this.logger.log("Database connection successful");
		} catch (error) {
			this.logger.error("Shutting down application due to database connection failure");

			// End the process to prevent application startup
			this.logger.error(
				`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			process.exit(1);
		} finally {
			await pool.end();
		}
	}
}
