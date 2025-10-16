import { z } from "./zod-openapi.js";

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const badgeResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Badge 1",
	description: "This is the badge 1",
};

export const badgeResponseSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		description: z.string(),
	})
	.openapi("BadgeResponseSchema", {
		example: badgeResponseSchemaExample,
	});

export const badgeResponseArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Badge 1",
		description: "This is the badge 1",
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Badge 2",
		description: "This is the badge 2",
	},
];

export const badgeResponseArraySchema = z
	.array(badgeResponseSchema)
	.openapi("BadgeResponseArraySchema", {
		example: badgeResponseArraySchemaExample,
	});

// ==========================================================
// TYPE schemas
// ==========================================================

export type BadgeResponseSchema = z.infer<typeof badgeResponseSchema>;
export type BadgeResponseArraySchema = z.infer<typeof badgeResponseArraySchema>;
