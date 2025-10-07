import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

@Module({
	imports: [DatabaseModule],
	controllers: [SubscriptionsController],
	providers: [SubscriptionsService],
})
export class SubscriptionsModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(SubscriptionsController);
	}
}
