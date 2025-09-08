import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put } from "@nestjs/common";
import {
	CreateUserSchema,
	createUserSchema,
	UpdateUserSchema,
	updateUserSchema,
} from "@repo/schemas";
import { ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	// GET /user
	@Get()
	async getAllUsers() {
		return await this.userService.getUsers();
	}

	// GET /user/:id
	@Get(":id")
	async getUserById(@Param("id") id: string) {
		return await this.userService.getUserById(id);
	}

	// POST /user
	@Post()
	async createUser(@Body(new ZodValidationPipe(createUserSchema)) data: CreateUserSchema) {
		return await this.userService.createUser(data);
	}

	//  UPDATE /user/:id
	@Put(":id")
	async updateFullUser(
		@Body(new ZodValidationPipe(createUserSchema)) data: CreateUserSchema,
		@Param("id") id: string,
	) {
		return await this.userService.updateUser(id, data);
	}

	// PATCH /user/:id
	@Patch(":id")
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
	async deleteUser(@Param("id") id: string) {
		return await this.userService.deleteUser(id);
	}
}
