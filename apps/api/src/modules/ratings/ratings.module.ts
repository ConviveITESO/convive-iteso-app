import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { RatingsController } from "./ratings.controller";
import { RatingsService } from "./ratings.service";

@Module({
	imports: [DatabaseModule],
	controllers: [RatingsController],
	providers: [RatingsService],
	exports: [RatingsService],
})
export class RatingsModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(RatingsController);
	}
}
