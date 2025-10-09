import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	CategoryIdParamSchema,
	CategoryQuerySchema,
	CategoryResponseSchema,
	CreateCategorySchema,
	UpdateCategorySchema,
} from "@repo/schemas";
import { and, count, eq, inArray, like, SQL } from "drizzle-orm";
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

	/**
	 * Gets all categories from the database with optional filtering
	 * @param query Query parameters for filtering
	 * @returns all categories matching the criteria
	 */
	async getAllCategories(query?: CategoryQuerySchema) {
		if (!query || Object.keys(query).length === 0) {
			return await this.db.query.categories.findMany();
		}

		const conditions: SQL[] = [];
		if (query.name) {
			conditions.push(like(categories.name, `%${query.name}%`));
		}
		if (query.status) {
			conditions.push(like(categories.status, `%${query.status}%`));
		}

		return await this.db.query.categories.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
		});
	}

	/**
	 * Gets a single category by its id
	 * @param categoryId The UUID of the category
	 * @returns The category or undefined
	 */
	async getCategoryById(categoryId: CategoryIdParamSchema) {
		return await this.db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
		});
	}

	/**
	 * Creates a new category
	 * @param data Data of the category
	 * @returns success
	 */
	async createCategory(data: CreateCategorySchema, createdBy: string) {
		const result = await this.db
			.insert(categories)
			.values({ ...data, createdBy })
			.returning();
		return result[0];
	}

	/**
	 * Updates a single category
	 * @param categoryId The UUID of the category
	 * @param data The data for update
	 * @returns The updated category or undefined
	 */
	async updateCategory(categoryId: CategoryIdParamSchema, data: UpdateCategorySchema) {
		const result = await this.db
			.update(categories)
			.set({ ...data })
			.where(eq(categories.id, categoryId))
			.returning();
		return result[0];
	}

	/**
	 * Soft deletes a category by its id
	 * @param categoryId The UUID of the category
	 * @returns The deleted category or undefined
	 */
	async deleteCategory(categoryId: CategoryIdParamSchema) {
		const category = await this.getCategoryById(categoryId);
		if (!category) return undefined;
		await this.db
			.update(categories)
			.set({
				status: "deleted",
				deletedAt: new Date(),
			})
			.where(eq(categories.id, categoryId));
		return category;
	}

	formatCategory(category: Category): CategoryResponseSchema {
		return {
			id: category.id,
			name: category.name,
			createdBy: category.createdBy,
			status: category.status,
			createdAt: category.createdAt.toISOString(),
			updatedAt: category.updatedAt ? category.updatedAt.toISOString() : null,
			deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
		};
	}
}
