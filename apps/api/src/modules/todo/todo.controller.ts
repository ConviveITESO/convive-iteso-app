import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UsePipes,
} from "@nestjs/common";
import {
	CreateTodoSchema,
	createTodoSchema,
	UpdateTodoSchema,
	updateTodoSchema,
} from "@repo/schemas";
import { ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";
import { TodoService } from "./todo.service";

@Controller("todos")
export class TodoController {
	constructor(private readonly todosService: TodoService) {}

	// GET /todos
	@Get()
	async getAllTodos() {
		return await this.todosService.getTodos();
	}

	// POST /todos/todo
	@Post("todo")
	@UsePipes(new ZodValidationPipe(createTodoSchema))
	async createTodo(@Body() data: CreateTodoSchema) {
		return await this.todosService.addTodo(data);
	}

	// PATCH /todos/todo/:id
	@Patch("todo/:id")
	async updateTodo(
		@Body(new ZodValidationPipe(updateTodoSchema)) data: UpdateTodoSchema,
		@Param("id") id: string,
	) {
		if (!data.description && !data.status && !data.title)
			throw new BadRequestException("Please provide at least one field to update");
		return await this.todosService.updateTodo(id, data);
	}

	// DELETE /todos/todo/:id
	@Delete("todo/:id")
	async deleteTodo(@Param("id") id: string) {
		return await this.todosService.deleteTodo(id);
	}
}
