import {
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	Param,
	Patch,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateUserSchema,
	createUserSchema,
	UpdateUserSchema,
	UserIdParamSchema,
	UserQuerySchema,
	updateUserSchema,
	userIdParamSchema,
	userQuerySchema,
	userResponseArraySchema,
	userResponseSchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodParam,
	ZodQuery,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserService } from "./user.service";

@ApiTags("User")
@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	// GET /user
	@Get()
	@ZodQuery(userQuerySchema, "search")
	@ZodOk(userResponseArraySchema)
	async getAllUsers(@Query() query?: UserQuerySchema) {
		return await this.userService.getUsers(query);
	}

	// GET /user/:id
	@Get(":id")
	@ZodParam(userIdParamSchema, "id")
	@ZodOk(userResponseSchema)
	async getUserById(@Param(new ZodValidationPipe(userIdParamSchema)) id: UserIdParamSchema) {
		return await this.userService.getUserById(id);
	}

	// POST /user
	@Post()
	@ZodBody(createUserSchema)
	@ZodCreated(userResponseSchema)
	async createUser(@Body(new ZodValidationPipe(createUserSchema)) data: CreateUserSchema) {
		return await this.userService.createUser(data);
	}

	//  UPDATE /user/:id
	@Put(":id")
	@ZodParam(userIdParamSchema, "id")
	@ZodBody(createUserSchema)
	@ZodOk(userResponseSchema)
	async updateFullUser(
		@Body(new ZodValidationPipe(createUserSchema)) data: CreateUserSchema,
		@Param(new ZodValidationPipe(userIdParamSchema)) id: UserIdParamSchema,
	) {
		return await this.userService.updateUser(id, data);
	}

	// PATCH /user/:id
	@Patch(":id")
	@ZodParam(userIdParamSchema, "id")
	@ZodBody(updateUserSchema)
	@ZodOk(userResponseSchema)
	async updateUser(
		@Body(new ZodValidationPipe(updateUserSchema)) data: UpdateUserSchema,
		@Param(new ZodValidationPipe(userIdParamSchema)) id: UserIdParamSchema,
	) {
		const logger = new Logger(UserController.name);
		logger.debug(`PATCH /user/${id} - Raw body received: ${JSON.stringify(data)}`);
		logger.debug(`Data type: ${typeof data}`);
		return await this.userService.updateUser(id, data);
	}

	// DELETE /user/:id
	@Delete(":id")
	@ZodParam(userIdParamSchema, "id")
	@ZodOk(userResponseSchema)
	async deleteUser(@Param(new ZodValidationPipe(userIdParamSchema)) id: UserIdParamSchema) {
		return await this.userService.deleteUser(id);
	}
}
