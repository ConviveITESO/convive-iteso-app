import { userResponseSchema, userResponseSchemaExample } from "./users";
import { z } from "./zod-openapi.js";

// ==========================================================
// BODY schemas
// ==========================================================

export const createGroupSchemaExample = {
	name: "Group 1",
	description: "This is the group 1",
};

export const createGroupSchema = z
	.object({
		name: z
			.string("The name is required")
			.nonempty("The name is required")
			.max(256, "The name can have a maximum of 256 characters"),
		description: z
			.string("The description is required")
			.nonempty("The description is required")
			.max(1024, "The description can have a maximum of 1024 characters"),
	})
	.openapi("CreateGroupSchema", {
		example: createGroupSchemaExample,
	});

export const updateGroupSchema = createGroupSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		error: "At least one field must be provided for update",
	})
	.openapi("UpdateGroupSchema", {
		example: createGroupSchemaExample,
	});

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const groupResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Group 1",
	description: "This is the group 1",
};

export const groupResponseSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		description: z.string(),
		createdBy: userResponseSchema.optional(),
	})
	.openapi("GroupResponseSchema", {
		example: groupResponseSchemaExample,
	});

export const groupResponseArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Group 1",
		description: "This is the group 1",
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Group 2",
		description: "This is the group 2",
		createdBy: userResponseSchemaExample,
	},
];

export const groupResponseArraySchema = z
	.array(groupResponseSchema)
	.openapi("GroupResponseArraySchema", {
		example: groupResponseArraySchemaExample,
	});

export const groupMessageSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	userId: "550e8400-e29b-41d4-a716-446655440000",
	username: "User 1",
	content: "This is the group 1",
	createdAt: "2025-01-01T00:00:00.000Z",
};

export const groupMessageSchema = z
	.object({
		id: z.uuid(),
		userId: z.string(),
		username: z.string(),
		profile: z.string().nullable(),
		content: z.string(),
		createdAt: z.date(),
	})
	.openapi("GroupMessageSchema", {
		example: groupMessageSchemaExample,
	});

export const groupMessageArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		userId: "550e8400-e29b-41d4-a716-446655440000",
		username: "User 1",
		content: "This is the group 1",
		createdAt: "2025-01-01T00:00:00.000Z",
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		userId: "550e8400-e29b-41d4-a716-446655440000",
		username: "User 2",
		content: "This is the group 2",
		createdAt: "2025-01-01T00:00:00.000Z",
	},
];

export const groupMessageArraySchema = z
	.array(groupMessageSchema)
	.openapi("GroupMessageArraySchema", {
		example: groupMessageArraySchemaExample,
	});

// ==========================================================
// TYPE schemas
// ==========================================================

export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
export type UpdateGroupSchema = z.infer<typeof updateGroupSchema>;
export type GroupResponseSchema = z.infer<typeof groupResponseSchema>;
export type GroupResponseArraySchema = z.infer<typeof groupResponseArraySchema>;
export type GroupMessageSchema = z.infer<typeof groupMessageSchema>;
export type GroupMessageArraySchema = z.infer<typeof groupMessageArraySchema>;
