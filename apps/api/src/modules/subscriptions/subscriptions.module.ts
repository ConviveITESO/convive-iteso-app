import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

@Module({
	imports: [DatabaseModule, ConfigModule, NotificationsModule],
	controllers: [SubscriptionsController],
	providers: [SubscriptionsService, AuthMiddleware],
})
export class SubscriptionsModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(SubscriptionsController);
	}
}
