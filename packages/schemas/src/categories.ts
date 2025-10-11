import { z } from "./zod-openapi.js";

// ==========================================================
// PARAMS schemas
// ==========================================================

export const categoryIdParamSchema = z.uuid().openapi("CategoryIdParamSchema", {
	description: "Category ID",
	example: "550e8400-e29b-41d4-a716-446655440000",
});

// ==========================================================
// QUERY schemas
// ==========================================================

export const categoryQuerySchema = z
	.object({
		name: z.string().optional().openapi({
			description: "Category name",
		}),
		status: z.enum(["active", "deleted"]).optional().openapi({
			description: "Category status",
		}),
	})
	.openapi("CategoryQuerySchema");

// ==========================================================
// BODY schemas
// ==========================================================

export const createCategorySchema = z
	.object({
		name: z
			.string("The name is required")
			.min(3, "The name must be at least 3 characters long")
			.openapi({
				description: "Category name",
			}),
		status: z.enum(["active", "deleted"]).openapi({
			description: "Category status",
		}),
	})
	.openapi("CreateCategorySchema", {
		example: {
			name: "New Category",
			status: "active",
		},
	});

export const updateCategorySchema = createCategorySchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	})
	.openapi("UpdateCategorySchema", {
		example: {
			name: "Updated Category",
			status: "deleted",
		},
	});

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const categoryResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Category 1",
	createdBy: "550e8400-e29b-41d4-a716-446655440000",
	status: "active",
	createdAt: "2023-10-01T12:00:00Z",
	updatedAt: "2023-10-01T12:00:00Z",
	deletedAt: null,
};

export const categoryResponseSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		createdBy: z.uuid(),
		status: z.enum(["active", "deleted"]),
		createdAt: z.string(),
		updatedAt: z.string().nullable(),
		deletedAt: z.string().nullable(),
	})
	.openapi("CategoryResponseSchema", {
		example: categoryResponseSchemaExample,
	});

export const categoryResponseArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Category 1",
		createdBy: "550e8400-e29b-41d4-a716-446655440000",
		status: "active",
		createdAt: "2023-10-01T12:00:00Z",
		updatedAt: "2023-10-01T12:00:00Z",
		deletedAt: null,
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Category 2",
		createdBy: "550e8400-e29b-41d4-a716-446655440000",
		status: "active",
		createdAt: "2023-10-01T12:00:00Z",
		updatedAt: "2023-10-01T12:00:00Z",
		deletedAt: null,
	},
];

export const categoryResponseArraySchema = z
	.array(categoryResponseSchema)
	.openapi("CategoryResponseSchema", {
		example: categoryResponseArraySchemaExample,
	});

// ==========================================================
// TYPE schemas
// ==========================================================

export type CategoryIdParamSchema = z.infer<typeof categoryIdParamSchema>;
export type CategoryQuerySchema = z.infer<typeof categoryQuerySchema>;
export type CategoryResponseSchema = z.infer<typeof categoryResponseSchema>;
export type CategoryResponseArraySchema = z.infer<typeof categoryResponseArraySchema>;
export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
