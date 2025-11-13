import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
	imports: [DatabaseModule],
	controllers: [CommentsController],
	providers: [CommentsService],
})
export class CommentsModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(CommentsController);
	}
}
