import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE_CONNECTION } from "./connection";
import { DatabaseHealthService } from "./database-health.service";
import * as schemas from "./schemas";
import { InitialDataService } from "./seed/initial-data.service";

@Module({
	providers: [
		DatabaseHealthService,
		{
			provide: DATABASE_CONNECTION,
			/**
			 * Connect to postgres pool using DrizzleORM
			 * @param configService
			 * @returns
			 */
			useFactory(configService: ConfigService) {
				const pool = new Pool({
					connectionString: configService.getOrThrow("DATABASE_URL"),
				});
				return drizzle(pool, {
					schema: {
						...schemas,
					},
				});
			},
			inject: [ConfigService],
		},
		InitialDataService,
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
