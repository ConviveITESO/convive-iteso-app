import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { TodoModule } from "./modules/todo/todo.module";
import { UserModule } from "./modules/user/user.module";

@Module({
	imports: [
		TodoModule,
		DatabaseModule,
		ConfigModule.forRoot({ isGlobal: true }),
		HealthModule,
		UserModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
