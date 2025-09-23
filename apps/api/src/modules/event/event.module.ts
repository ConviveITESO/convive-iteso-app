import { Module } from "@nestjs/common";
import { BadgeModule } from "../badge/badge.module";
import { CategoryModule } from "../category/category.module";
import { DatabaseModule } from "../database/database.module";
import { GroupModule } from "../group/group.module";
import { LocationModule } from "../location/location.module";
import { UserModule } from "../user/user.module";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";

@Module({
	controllers: [EventController],
	providers: [EventService],
	imports: [DatabaseModule, UserModule, GroupModule, LocationModule, CategoryModule, BadgeModule],
	exports: [EventService],
})
export class EventModule {}
