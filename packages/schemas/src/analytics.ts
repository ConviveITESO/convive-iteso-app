// analytics.ts
import { z } from "./zod-openapi.js";

/* ============================================
 * Commons
 * ============================================ */

export const subscriptionStatusEnum = z
	.enum(["registered", "waitlisted", "cancelled", "attended"])
	.openapi("SubscriptionStatusEnum");

/* ============================================
 * 1) GET /events/:id/analytics/participants
 * ============================================ */

export const eventAnalyticsParticipantsRowSchemaExample = {
	userId: "9c51e557-77fe-4d3f-9d8c-3b6d5f6b7e21",
	userName: "Jane Doe",
	subscriptionStatus: "registered",
	eventQuota: 60,
};

export const eventAnalyticsParticipantsRowSchema = z
	.object({
		userId: z.uuid(),
		userName: z.string(),
		subscriptionStatus: subscriptionStatusEnum,
		eventQuota: z.number().int().nonnegative(),
	})
	.openapi("EventAnalyticsParticipantsRowSchema", {
		example: eventAnalyticsParticipantsRowSchemaExample,
	});

export const eventAnalyticsParticipantsResponseSchemaExample = [
	eventAnalyticsParticipantsRowSchemaExample,
];

export const eventAnalyticsParticipantsResponseSchema = z
	.array(eventAnalyticsParticipantsRowSchema)
	.openapi("EventAnalyticsParticipantsResponseSchema", {
		example: eventAnalyticsParticipantsResponseSchemaExample,
	});

/* ============================================
 * 2) GET /events/:id/analytics/chart
 * ============================================ */

export const eventAnalyticsChartSimpleSliceSchema = z.object({
	name: z.enum(["registered", "waitlisted", "cancelled", "attended", "quota"]),
	count: z.number().int().nonnegative(),
});

export const eventAnalyticsChartSimpleResponseSchemaExample = [
	{ name: "registered", count: 10 },
	{ name: "cancelled", count: 10 },
	{ name: "waitlisted", count: 20 },
	{ name: "attended", count: 5 },
	{ name: "quota", count: 10 },
];

export const eventAnalyticsChartSimpleResponseSchema = z
	.array(eventAnalyticsChartSimpleSliceSchema)
	.openapi("EventAnalyticsChartSimpleResponseSchema", {
		example: eventAnalyticsChartSimpleResponseSchemaExample,
	});

/* ============================================
 * Types
 * ============================================ */

export type EventAnalyticsParticipantsRowSchema = z.infer<
	typeof eventAnalyticsParticipantsRowSchema
>;
export type EventAnalyticsParticipantsResponseSchema = z.infer<
	typeof eventAnalyticsParticipantsResponseSchema
>;
export type EventAnalyticsChartSimpleResponseSchema = z.infer<
	typeof eventAnalyticsChartSimpleResponseSchema
>;
