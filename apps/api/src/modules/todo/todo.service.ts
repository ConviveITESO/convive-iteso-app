import { Inject, Injectable } from "@nestjs/common";
import { CreateTodoSchema, UpdateTodoSchema } from "@repo/schemas";
import { eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { todos } from "../database/schemas";

@Injectable()
export class TodoService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * Gets all todos from the database
	 * @returns all todos
	 */
	async getTodos() {
		return await this.db.query.todos.findMany();
	}

	/**
	 * Gets a single todo by its id
	 * @param todoId The id of the todo
	 * @returns The todo or undefined
	 */
	async getTodoById(todoId: string) {
		return await this.db.query.todos.findFirst({
			where: eq(todos.id, todoId),
		});
	}

	/**
	 * Creates a new Todo
	 * @param data Data of the todo
	 * @returns success
	 */
	async addTodo(data: CreateTodoSchema) {
		const result = await this.db
			.insert(todos)
			.values({ ...data })
			.returning();
		return result[0];
	}

	/**
	 * Updates a single todo
	 * @param todoId The id of the TODO
	 * @param data The data for update
	 * @returns The updated todo or undefined
	 */
	async updateTodo(todoId: string, data: UpdateTodoSchema) {
		const result = await this.db
			.update(todos)
			.set({ ...data })
			.where(eq(todos.id, todoId))
			.returning();
		return result[0];
	}

	/**
	 * Deltes a todo by its id
	 * @param todoId The id of the todo
	 * @returns The deleted todo
	 */
	async deleteTodo(todoId: string) {
		const todo = await this.getTodoById(todoId);
		if (!todo) return undefined;
		await this.db.delete(todos).where(eq(todos.id, todoId));
		return todo;
	}
}
