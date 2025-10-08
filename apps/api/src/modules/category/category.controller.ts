import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CategoryResponseSchema, categoryResponseSchema } from "@repo/schemas";
import { ZodOk } from "@/pipes/zod-validation/zod-validation.pipe";
import { AuthGuard } from "../auth/guards/auth.guard";
import { CategoryService } from "./category.service";

@ApiTags("Category")
@Controller("categories")
@UseGuards(AuthGuard)
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	// GET /categories
	@Get()
	@ZodOk(categoryResponseSchema)
	async createEvent(): Promise<CategoryResponseSchema[]> {
		return this.categoryService.getAllCategories();
	}
}
