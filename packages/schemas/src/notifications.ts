import { z } from "./zod-openapi.js";

export const notificationKind = z.enum(["canceled", "rescheduled", "reminder", "location"]);

export const metadataResponseSchema = z.object({
	originalDate: z.date().optional(),
	newDate: z.date().optional(),
	location: z.string().optional(),
});

export const notificationSchema = z.object({
	id: z.string().uuid(),
	kind: notificationKind,
	title: z.string(),
	body: z.string(),
	eventId: z.string().uuid(),
	userId: z.string().uuid(),
	createdAt: z.date(),
	readAt: z.date().optional(),
	meta: metadataResponseSchema.optional(),
});

export const notificationsResponseSchema = z.array(notificationSchema);
export const notificationIdParamSchema = z.object({ id: z.string().uuid() });

// ==========================================================
// BODY schemas
// ==========================================================

export const metadataSchema = z.object({
	originalDate: z.coerce.date().optional(),
	newDate: z.coerce.date().optional(),
	location: z.string().optional(),
});

export const createNotificationTestSchema = z
	.object({
		eventId: z.uuid(),
		kind: notificationKind,
		title: z.string(),
		body: z.string(),
		meta: metadataSchema.optional(),
	})
	.openapi("CreateNotificationTestSchema", {
		example: {
			eventId: "123e4567-e89b-12d3-a456-426614174000",
			kind: "reminder",
			title: "Test Notification",
			body: "This is a test notification",
			meta: {
				originalDate: "2025-01-01T00:00:00.000Z",
				newDate: "2025-01-02T00:00:00.000Z",
				location: "Main Hall",
			},
		},
	});

// ==========================================================
// TYPE schemas
// ==========================================================

export type NotificationKind = z.infer<typeof notificationKind>;
export type NotificationMetadataResponse = z.infer<typeof metadataResponseSchema>;
export type NotificationResponse = z.infer<typeof notificationSchema>;
export type NotificationMetadata = z.infer<typeof metadataSchema>;
export type CreateNotificationTestSchema = z.infer<typeof createNotificationTestSchema>;
