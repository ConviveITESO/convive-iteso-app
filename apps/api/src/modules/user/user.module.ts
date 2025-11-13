import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { S3Service } from "../s3/s3.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
	imports: [DatabaseModule],
	controllers: [UserController],
	providers: [UserService, S3Service],
	exports: [UserService],
})
export class UserModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(UserController);
	}
}
