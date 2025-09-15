import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put } from "@nestjs/common";
import {
	CreateUserSchema,
	createUserSchema,
	UpdateUserSchema,
	updateUserSchema,
} from "@repo/schemas";
import {
	ZodValidationPipe,
	ZodBody,
	ZodOk,
	ZodCreated,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserService } from "./user.service";
import { ApiParam, ApiTags } from "@nestjs/swagger";

@ApiTags("User")
@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	// GET /user
	@Get()
	@ZodOk(updateUserSchema, [
		{
			id: "uuid-v4-string",
			name: "John Doe",
			email: "john@example.com",
			age: 25,
			birthDate: "2000-01-01",
			password: "Password123!",
			createdAt: "20XX-01-01T12:00:00Z",
		},
	])
	async getAllUsers() {
		return await this.userService.getUsers();
	}

	// GET /user/:id
	@Get(":id")
	@ZodOk(updateUserSchema, {
		id: "uuid-v4-string",
		name: "John Doe",
		email: "john@example.com",
		age: 25,
		birthDate: "2000-01-01",
		password: "Password123!",
		createdAt: "20XX-01-01T12:00:00Z",
	})
	async getUserById(@Param("id") id: string) {
		return await this.userService.getUserById(id);
	}

	// POST /user
	@Post()
	@ZodBody(createUserSchema, {
		name: "John Doe",
		email: "john@example.com",
		age: 25,
		birthDate: "2000-01-01",
		password: "Password123!",
	})
	@ZodCreated(createUserSchema, {
		id: "uuid-v4-string",
		name: "John Doe",
		email: "john@example.com",
		age: 25,
		birthDate: "2000-01-01",
		password: "Password123!",
		createdAt: "20XX-01-01T12:00:00Z",
	})
	async createUser(@Body(new ZodValidationPipe(createUserSchema)) data: CreateUserSchema) {
		return await this.userService.createUser(data);
	}

	//  UPDATE /user/:id
	@Put(":id")
	@ZodBody(createUserSchema, {
		name: "John Doe",
	})
	@ZodOk(createUserSchema, {
		id: "uuid-v4-string",
		name: "John Doe",
		email: "john@example.com",
		age: 25,
		birthDate: "2000-01-01",
		password: "Password123!",
		createdAt: "20XX-01-01T12:00:00Z",
	})
	async updateFullUser(
		@Body(new ZodValidationPipe(createUserSchema)) data: CreateUserSchema,
		@Param("id") id: string,
	) {
		return await this.userService.updateUser(id, data);
	}

	// PATCH /user/:id
	@Patch(":id")
	@ZodBody(updateUserSchema, {
		name: "John Doe",
	})
	@ZodOk(updateUserSchema, {
		id: "uuid-v4-string",
		name: "John Doe",
		email: "john@example.com",
		age: 25,
		birthDate: "2000-01-01",
		password: "Password123!",
		createdAt: "20XX-01-01T12:00:00Z",
	})
	async updateUser(
		@Body(new ZodValidationPipe(updateUserSchema)) data: UpdateUserSchema,
		@Param("id") id: string,
	) {
		const logger = new Logger(UserController.name);
		logger.debug(`PATCH /user/${id} - Raw body received: ${JSON.stringify(data)}`);
		logger.debug(`Data type: ${typeof data}`);
		return await this.userService.updateUser(id, data);
	}

	// DELETE /user/:id
	@Delete(":id")
	@ZodOk(updateUserSchema, {
		id: "uuid-v4-string",
		name: "John Doe",
		email: "john@example.com",
		age: 25,
		birthDate: "2000-01-01",
		password: "Password123!",
		createdAt: "20XX-01-01T12:00:00Z",
	})
	async deleteUser(@Param("id") id: string) {
		return await this.userService.deleteUser(id);
	}
}
