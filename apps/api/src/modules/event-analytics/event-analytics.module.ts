import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { UserModule } from "../user/user.module";
import { EventAnalyticsController } from "./event-analytics.controller";
import { EventAnalyticsService } from "./event-analytics.service";

@Module({
	controllers: [EventAnalyticsController],
	providers: [EventAnalyticsService],
	imports: [DatabaseModule, UserModule],
	exports: [EventAnalyticsService],
})
export class EventAnalyticsModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(EventAnalyticsController);
	}
}
