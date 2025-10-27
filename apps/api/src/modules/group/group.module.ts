import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { UserModule } from "../user/user.module";
import { GroupController } from "./group.controller";
import { GroupService } from "./group.service";

@Module({
	controllers: [GroupController],
	providers: [GroupService],
	imports: [DatabaseModule, UserModule],
	exports: [GroupService],
})
export class GroupModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(GroupController);
	}
}
