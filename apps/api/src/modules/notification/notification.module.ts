import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { DatabaseModule } from "@/modules/database/database.module";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

@Module({
	imports: [DatabaseModule],
	providers: [NotificationService],
	controllers: [NotificationController],
})
export class NotificationModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(NotificationController);
	}
}
