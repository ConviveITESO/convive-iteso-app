import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
	imports: [DatabaseModule, ConfigModule],
	controllers: [HealthController],
	providers: [HealthService],
})
export class HealthModule {}
