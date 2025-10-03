import { z } from "./zod-openapi.js";

// ==========================================================
// PARAMS schemas
// ==========================================================

export const subscriptionIdParamSchema = z.uuid().openapi("SubscriptionIdParamSchema", {
	description: "Subscription ID",
	example: "123e4567-e89b-12d3-a456-426614174000",
});

export const eventIdParamSchema = z.uuid().openapi("EventIdParamSchema", {
	description: "Event ID",
	example: "123e4567-e89b-12d3-a456-426614174000",
});

// ==========================================================
// QUERY schemas
// ==========================================================

export const subscriptionQuerySchema = z
	.object({
		status: z.enum(["registered", "waitlisted", "cancelled"]).optional().openapi({
			description: "Filter by subscription status",
		}),
		eventId: z.uuid().optional().openapi({
			description: "Filter by event ID",
		}),
	})
	.openapi("SubscriptionQuerySchema");

// ==========================================================
// BODY schemas
// ==========================================================

export const createSubscriptionSchema = z
	.object({
		eventId: z.uuid().openapi({
			description: "Event ID to register for",
		}),
	})
	.openapi("CreateSubscriptionSchema", {
		example: {
			eventId: "123e4567-e89b-12d3-a456-426614174000",
		},
	});

export const updateSubscriptionSchema = z
	.object({
		status: z.enum(["registered", "waitlisted", "cancelled"]).optional().openapi({
			description: "Update subscription status",
		}),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	})
	.openapi("UpdateSubscriptionSchema", {
		example: {
			status: "cancelled",
		},
	});

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const subscriptionResponseSchema = z
	.object({
		id: z.uuid(),
		userId: z.uuid(),
		eventId: z.uuid(),
		status: z.enum(["registered", "waitlisted", "cancelled"]),
		position: z.number().nullable(),
	})
	.openapi("SubscriptionResponseSchema", {
		example: {
			id: "123e4567-e89b-12d3-a456-426614174000",
			userId: "123e4567-e89b-12d3-a456-426614174000",
			eventId: "123e4567-e89b-12d3-a456-426614174000",
			status: "registered",
			position: null,
		},
	});

export const subscriptionArrayResponseSchema = z
	.array(subscriptionResponseSchema)
	.openapi("SubscriptionArrayResponseSchema", {
		example: [
			{
				id: "123e4567-e89b-12d3-a456-426614174000",
				userId: "123e4567-e89b-12d3-a456-426614174000",
				eventId: "123e4567-e89b-12d3-a456-426614174000",
				status: "registered",
				position: null,
			},
			{
				id: "123e4567-e89b-12d3-a456-426614174000",
				userId: "123e4567-e89b-12d3-a456-426614174000",
				eventId: "123e4567-e89b-12d3-a456-426614174000",
				status: "waitlisted",
				position: 5,
			},
		],
	});

// ==========================================================
// TYPE schemas
// ==========================================================
export type SubscriptionIdParamSchema = z.infer<typeof subscriptionIdParamSchema>;
export type EventIdParamSchema = z.infer<typeof eventIdParamSchema>;
export type SubscriptionQuerySchema = z.infer<typeof subscriptionQuerySchema>;
export type CreateSubscriptionSchema = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionSchema = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionResponseSchema = z.infer<typeof subscriptionResponseSchema>;
export type SubscriptionArrayResponseSchema = z.infer<typeof subscriptionArrayResponseSchema>;
