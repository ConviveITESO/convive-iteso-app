import { z } from "./zod-openapi.js";

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const categoryResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Category 1",
};

export const categoryResponseSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
	})
	.openapi("CategoryResponseSchema", {
		example: categoryResponseSchemaExample,
	});

export const categoryResponseArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Category 1",
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Category 2",
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

export type CategoryResponseSchema = z.infer<typeof categoryResponseSchema>;
export type CategoryResponseArraySchema = z.infer<typeof categoryResponseArraySchema>;
