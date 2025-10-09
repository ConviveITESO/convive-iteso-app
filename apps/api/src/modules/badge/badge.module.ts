import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { BadgeController } from "./badge.controller";
import { BadgeService } from "./badge.service";

@Module({
	controllers: [BadgeController],
	providers: [BadgeService],
	imports: [DatabaseModule],
	exports: [BadgeService],
})
export class BadgeModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(BadgeController);
	}
}
