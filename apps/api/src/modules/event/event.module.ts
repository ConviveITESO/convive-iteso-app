import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { BadgeModule } from "../badge/badge.module";
import { CategoryModule } from "../category/category.module";
import { DatabaseModule } from "../database/database.module";
import { GroupModule } from "../group/group.module";
import { LocationModule } from "../location/location.module";
import { RatingsModule } from "../ratings/ratings.module";
import { S3Module } from "../s3/s3.module";
import { UserModule } from "../user/user.module";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";

@Module({
	controllers: [EventController],
	providers: [EventService],
	imports: [
		DatabaseModule,
		RatingsModule,
		UserModule,
		GroupModule,
		LocationModule,
		CategoryModule,
		BadgeModule,
		S3Module,
	],
	exports: [EventService],
})
export class EventModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(EventController);
	}
}
