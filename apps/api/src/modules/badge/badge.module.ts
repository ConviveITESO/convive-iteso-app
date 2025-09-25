import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { BadgeService } from "./badge.service";

@Module({
	providers: [BadgeService],
	imports: [DatabaseModule],
	exports: [BadgeService],
})
export class BadgeModule {}
