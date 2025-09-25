import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { LocationService } from "./location.service";

@Module({
	providers: [LocationService],
	imports: [DatabaseModule],
	exports: [LocationService],
})
export class LocationModule {}
