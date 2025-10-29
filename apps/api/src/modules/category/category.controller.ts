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
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CategoryIdParamSchema,
	CategoryQuerySchema,
	CreateCategorySchema,
	categoryIdParamSchema,
	categoryQuerySchema,
	categoryResponseArraySchema,
	categoryResponseSchema,
	createCategorySchema,
	UpdateCategorySchema,
	updateCategorySchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodParam,
	ZodQuery,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserRequest } from "@/types/user.request";
import { UserStatusGuard } from "../auth/guards/user.status.guard";
import { CategoryService } from "./category.service";

@ApiTags("Category")
@Controller("categories")
@UseGuards(UserStatusGuard)
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	// GET /category
	@Get()
	@ZodQuery(categoryQuerySchema, "search")
	@ZodOk(categoryResponseArraySchema)
	async getAllCategories(@Query() query?: CategoryQuerySchema) {
		return await this.categoryService.getAllCategories(query);
	}

	// GET /category/:id
	@Get(":id")
	@ZodParam(categoryQuerySchema, "id")
	async getCategoryById(@Param("id") id: string) {
		return await this.categoryService.getCategoryById(id);
	}

	// POST /category
	@Post()
	@ZodBody(createCategorySchema)
	@ZodCreated(categoryResponseSchema)
	async createCategory(
		@Req() req: UserRequest,
		@Body(new ZodValidationPipe(createCategorySchema)) data: CreateCategorySchema,
	) {
		return await this.categoryService.createCategory(data, req.user.id);
	}

	// UPDATE /category/:id
	@Put(":id")
	@ZodParam(categoryIdParamSchema, "id")
	@ZodBody(createCategorySchema)
	@ZodOk(categoryResponseSchema)
	async updateFullCategory(
		@Body(new ZodValidationPipe(createCategorySchema)) data: CreateCategorySchema,
		@Param(new ZodValidationPipe(categoryIdParamSchema)) id: CategoryIdParamSchema,
	) {
		return await this.categoryService.updateCategory(id, data);
	}

	// PATCH /category/:id
	@Patch(":id")
	@ZodParam(categoryIdParamSchema, "id")
	@ZodBody(updateCategorySchema)
	@ZodOk(categoryResponseSchema)
	async updateCategory(
		@Body(new ZodValidationPipe(updateCategorySchema)) data: UpdateCategorySchema,
		@Param(new ZodValidationPipe(categoryIdParamSchema)) id: CategoryIdParamSchema,
	) {
		const logger = new Logger(CategoryController.name);
		logger.debug(`PATCH /category/${id} - Raw body received: ${JSON.stringify(data)}`);
		logger.debug(`Data type: ${typeof data}`);
		return await this.categoryService.updateCategory(id, data);
	}

	// DELETE /category/:id
	@Delete(":id")
	@ZodParam(categoryIdParamSchema, "id")
	@ZodOk(categoryResponseSchema)
	async deleteCategory(
		@Param(new ZodValidationPipe(categoryIdParamSchema)) id: CategoryIdParamSchema,
	) {
		return await this.categoryService.deleteCategory(id);
	}
}
