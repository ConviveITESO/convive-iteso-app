import { z } from "./zod-openapi.js";

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const locationResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Location 1",
};

export const locationResponseSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
	})
	.openapi("LocationResponseSchema", {
		example: locationResponseSchemaExample,
	});

export const locationResponseArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Location 1",
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Location 2",
	},
];

export const locationResponseArraySchema = z
	.array(locationResponseSchema)
	.openapi("LocationResponseArraySchema", {
		example: locationResponseArraySchemaExample,
	});

// ==========================================================
// TYPE schemas
// ==========================================================

export type LocationResponseSchema = z.infer<typeof locationResponseSchema>;
export type LocationResponseArraySchema = z.infer<typeof locationResponseArraySchema>;
