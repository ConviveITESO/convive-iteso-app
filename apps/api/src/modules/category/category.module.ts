import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AuthMiddleware } from "../auth/middlewares/auth.middleware";
import { DatabaseModule } from "../database/database.module";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";

@Module({
	controllers: [CategoryController],
	providers: [CategoryService],
	imports: [DatabaseModule],
	exports: [CategoryService],
})
export class CategoryModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(CategoryController);
	}
}
