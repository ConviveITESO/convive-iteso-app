import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CategoryResponseSchema } from "@repo/schemas";
import { and, count, eq, inArray } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { Category, categories } from "../database/schemas";

@Injectable()
export class CategoryService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async assertCategoriesExist(ids: string[]): Promise<void> {
		const result = await this.db
			.select({ count: count() })
			.from(categories)
			.where(and(inArray(categories.id, ids), eq(categories.status, "active")));
		// biome-ignore lint/style/noNonNullAssertion: <>
		const categoriesCount = result[0]!.count;
		if (ids.length !== categoriesCount) throw new NotFoundException("Category not found");
	}

	async getAllCategories(): Promise<CategoryResponseSchema[]> {
		return this.db
			.select({
				id: categories.id,
				name: categories.name,
			})
			.from(categories)
			.where(eq(categories.status, "active"));
	}

	formatCategory(category: Category): CategoryResponseSchema {
		return {
			id: category.id,
			name: category.name,
		};
	}
}
