import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { TodoController } from "./todo.controller";
import { TodoService } from "./todo.service";

@Module({
	imports: [DatabaseModule],
	controllers: [TodoController],
	providers: [TodoService],
})
export class TodoModule {}
