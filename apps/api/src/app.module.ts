import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./modules/database/database.module";
import { TodoModule } from "./modules/todo/todo.module";

@Module({
	imports: [TodoModule, DatabaseModule, ConfigModule.forRoot({ isGlobal: true })],
	controllers: [],
	providers: [],
})
export class AppModule {}
