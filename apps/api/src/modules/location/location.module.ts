import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { LocationController } from "./location.controller";
import { LocationService } from "./location.service";

@Module({
	controllers: [LocationController],
	providers: [LocationService],
	imports: [DatabaseModule],
	exports: [LocationService],
})
export class LocationModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(LocationController);
	}
}
