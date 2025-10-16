import { z } from "./zod-openapi.js";

// ==========================================================
// PARAMS schemas
// ==========================================================

export const subscriptionIdParamSchema = z
	.object({
		id: z.uuid().openapi("SubscriptionIdParamSchema", {
			description: "Subscription ID",
			example: "123e4567-e89b-12d3-a456-426614174000",
		}),
	})
	.openapi("SubscriptionIdParamSchema");

// ==========================================================
// QUERY schemas
// ==========================================================

export const subscriptionQuerySchema = z
	.object({
		status: z.enum(["registered", "waitlisted", "cancelled", "attended"]).optional().openapi({
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
		status: z
			.enum(["registered", "waitlisted", "cancelled", "attended", "attended"])
			.optional()
			.openapi({
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

export const subscriptionCheckInRequestSchema = z
	.object({
		eventId: z.uuid().openapi({
			description: "Event ID the subscription belongs to",
		}),
		subscriptionId: z.uuid().openapi({
			description: "Subscription ID provided by the attendee",
		}),
	})
	.openapi("SubscriptionCheckInRequestSchema", {
		example: {
			eventId: "123e4567-e89b-12d3-a456-426614174000",
			subscriptionId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
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
		status: z.enum(["registered", "waitlisted", "cancelled", "attended"]),
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

export const subscriptionCheckInResponseSchema = z
	.object({
		status: z
			.enum(["success", "already_checked_in", "invalid_subscription", "invalid_event"])
			.openapi({
				description: "Result of the check-in attempt",
			}),
		message: z.string().openapi({
			description: "Human-readable feedback for the staff member",
		}),
		attendeeName: z.string().optional().openapi({
			description: "Name of the attendee when available",
		}),
		subscription: subscriptionResponseSchema.optional().openapi({
			description: "Subscription data returned on successful check-in",
		}),
	})
	.openapi("SubscriptionCheckInResponseSchema", {
		example: {
			status: "success",
			message: "Check-in completed",
			attendeeName: "Doe, John",
			subscription: {
				id: "123e4567-e89b-12d3-a456-426614174000",
				userId: "123e4567-e89b-12d3-a456-426614174000",
				eventId: "123e4567-e89b-12d3-a456-426614174000",
				status: "attended",
				position: null,
			},
		},
	});

export const eventStatsResponseSchema = z
	.object({
		eventId: z.uuid(),
		registeredCount: z.number().int(),
		waitlistedCount: z.number().int(),
		spotsLeft: z.number().int(),
	})
	.openapi("EventStatsResponseSchema", {
		example: {
			eventId: "123e4567-e89b-12d3-a456-426614174000",
			registeredCount: 18,
			waitlistedCount: 5,
			spotsLeft: 32,
		},
	});

export const subscriptionIdResponseSchema = z
	.object({
		id: z.uuid(),
	})
	.openapi("SubscriptionIdResponseSchema", {
		example: {
			id: "123e4567-e89b-12d3-a456-426614174000",
		},
	});

// ==========================================================
// TYPE schemas
// ==========================================================
export type SubscriptionIdParamSchema = z.infer<typeof subscriptionIdParamSchema>;
export type SubscriptionQuerySchema = z.infer<typeof subscriptionQuerySchema>;
export type CreateSubscriptionSchema = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionSchema = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionResponseSchema = z.infer<typeof subscriptionResponseSchema>;
export type SubscriptionArrayResponseSchema = z.infer<typeof subscriptionArrayResponseSchema>;
export type EventStatsResponseSchema = z.infer<typeof eventStatsResponseSchema>;
export type SubscriptionIdResponseSchema = z.infer<typeof subscriptionIdResponseSchema>;
export type SubscriptionCheckInRequestSchema = z.infer<typeof subscriptionCheckInRequestSchema>;
export type SubscriptionCheckInResponseSchema = z.infer<typeof subscriptionCheckInResponseSchema>;
