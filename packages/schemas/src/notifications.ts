import { z } from "zod";

export const notificationKind = z.enum(["canceled", "rescheduled", "reminder", "location"]);

export const notificationSchema = z.object({
	id: z.string().uuid(),
	kind: notificationKind,
	title: z.string(),
	body: z.string(),
	eventId: z.string().uuid(),
	userId: z.string().uuid(),
	createdAt: z.string(),
	readAt: z.string().nullable().optional(),
	meta: z
		.object({
			originalDate: z.string().optional(),
			newDate: z.string().optional(),
			location: z.string().optional(),
		})
		.optional(),
});

export const notificationsResponseSchema = z.array(notificationSchema);
export const notificationIdParamSchema = z.object({ id: z.string().uuid() });

export type NotificationKind = z.infer<typeof notificationKind>;
export type NotificationResponse = z.infer<typeof notificationSchema>;
