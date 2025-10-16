import { badgeResponseArraySchema, badgeResponseArraySchemaExample } from "./badges";
import { categoryResponseArraySchema, categoryResponseArraySchemaExample } from "./categories";
import { groupResponseSchema, groupResponseSchemaExample } from "./groups";
import { locationResponseSchema, locationResponseSchemaExample } from "./locations";
import { userResponseSchema, userResponseSchemaExample } from "./users";
import { z } from "./zod-openapi.js";

// ==========================================================
// QUERY schemas
// ==========================================================

export const getEventsQuerySchema = z.object({
	name: z.string().optional(),
	locationId: z.string().optional(),
	categoryId: z.string().optional(),
	badgeId: z.string().optional(),
});

// ==========================================================
// PARAM schemas
// ==========================================================

export const eventIdParamSchema = z.object({
	id: z.uuid().openapi("EventIdParamSchema", {
		description: "Event ID",
		example: "123e4567-e89b-12d3-a456-426614174000",
	}),
});
// ==========================================================
// BODY schemas
// ==========================================================

export const createEventSchemaExample = {
	name: "Event 1",
	description: "This is the event 1",
	startDate: "2025-09-21T19:45:00Z",
	endDate: "2025-09-21T19:45:00Z",
	quota: 50,
	locationId: "3617ef1c-c37e-4383-80bd-a472577df765",
	categoryIds: ["3617ef1c-c37e-4383-80bd-a472577df765", "112117c6-c15f-4509-99ed-cf1aa90cceb3"],
	badgeIds: ["f07cd93d-0f08-41b2-d0d4-8f35a0dcb6a7", "7fc3482a-6243-4e8e-03e5-b7d6b7e5feac"],
};

export const createEventSchema = z
	.object({
		name: z
			.string("The name is required")
			.nonempty("The name is required")
			.max(256, "The name can have a maximum of 256 characters"),
		description: z
			.string("The description is required")
			.nonempty("The description is required")
			.max(1024, "The description can have a maximum of 1024 characters"),
		startDate: z.iso.datetime("The start date must be valid"),
		endDate: z.iso.datetime("The end date must be valid"),
		quota: z
			.number("The quota is required")
			.int("The quota must be an integer")
			.positive("The quota must be a positive integer"),
		locationId: z.uuid("The location id must be a uuid"),
		categoryIds: z.array(z.uuid("The category id must be a uuid")),
		badgeIds: z.array(z.uuid("The badge id must be a uuid")),
	})
	.refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
		error: "The start date must be before or equal to the end date",
		path: ["endDate"],
	})
	.refine((data) => hasUniqueIds(data.categoryIds), {
		error: "The category ids must be unique",
		path: ["categoryIds"],
	})
	.refine((data) => hasUniqueIds(data.badgeIds), {
		error: "The badge ids must be unique",
		path: ["badgeIds"],
	})
	.openapi("CreateEventSchema", {
		example: createEventSchemaExample,
	});

function hasUniqueIds(ids: string[]) {
	const uniqueIds = [...new Set(ids)];
	return ids.length === uniqueIds.length;
}

export const updateEventSchema = createEventSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		error: "At least one field must be provided for update",
	})
	.openapi("UpdateEventSchema", {
		example: createEventSchemaExample,
	});

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const eventResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Event 1",
	description: "This is event 1",
	startDate: "2025-09-21T19:45:00Z",
	endDate: "2025-09-21T19:45:00Z",
	quota: 50,
	createdBy: userResponseSchemaExample,
	location: locationResponseSchemaExample,
	group: groupResponseSchemaExample,
	categories: categoryResponseArraySchemaExample,
	badges: badgeResponseArraySchemaExample,
};

export const eventResponseSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		description: z.string(),
		startDate: z.iso.datetime(),
		endDate: z.iso.datetime(),
		quota: z.number(),
		createdBy: userResponseSchema,
		location: locationResponseSchema,
		group: groupResponseSchema,
		categories: categoryResponseArraySchema,
		badges: badgeResponseArraySchema,
	})
	.openapi("EventResponseSchema", {
		example: eventResponseSchemaExample,
	});

export const eventResponseArraySchemaExample = [
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Event 1",
		description: "This is event 1",
		startDate: "2025-09-21T19:45:00Z",
		endDate: "2025-09-21T19:45:00Z",
		quota: 50,
		createdBy: userResponseSchemaExample,
		location: locationResponseSchemaExample,
		group: groupResponseSchemaExample,
		categories: categoryResponseArraySchemaExample,
		badges: badgeResponseArraySchemaExample,
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Event 2",
		description: "This is event 2",
		startDate: "2024-09-21T19:45:00Z",
		endDate: "2025-09-21T19:45:00Z",
		quota: 20,
		createdBy: userResponseSchemaExample,
		location: locationResponseSchemaExample,
		group: groupResponseSchemaExample,
		categories: categoryResponseArraySchemaExample,
		badges: badgeResponseArraySchemaExample,
	},
];

export const eventResponseArraySchema = z
	.array(eventResponseSchema)
	.openapi("EventResponseArraySchema", {
		example: eventResponseArraySchemaExample,
	});

// ==========================================================
// TYPE schemas
// ==========================================================

export type GetEventsQuerySchema = z.infer<typeof getEventsQuerySchema>;
export type EventIdParamSchema = z.infer<typeof eventIdParamSchema>;
export type CreateEventSchema = z.infer<typeof createEventSchema>;
export type UpdateEventSchema = z.infer<typeof updateEventSchema>;
export type EventResponseSchema = z.infer<typeof eventResponseSchema>;
export type EventResponseArraySchema = z.infer<typeof eventResponseArraySchema>;
