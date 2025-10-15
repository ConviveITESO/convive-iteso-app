import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { ApiTags } from "@nestjs/swagger";
import {
	notificationIdParamSchema,
	notificationSchema,
	notificationsResponseSchema,
	type NotificationKind,
} from "@repo/schemas";
import { ZodOk, ZodParam, ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";
import { NotificationService } from "./notification.service";

const DEV_USER_ID = 1; // 👈 entero
type RequestWithUser = Request & {
	user?: {
		id?: number;
	};
};

type NotificationMetaBody = {
	originalDate?: string;
	newDate?: string;
	location?: string;
};

type CreateNotificationTestBody = {
	userId?: number;
	eventId?: number;
	kind?: NotificationKind;
	title?: string;
	body?: string;
	meta?: NotificationMetaBody;
};

const userIdFromReq = (req: RequestWithUser): number => {
	if (typeof req.user?.id === "number") return req.user.id;

	const header = req.headers["x-user-id"];
	const headerValue = Array.isArray(header) ? header[0] : header;
	const parsed = headerValue != null ? Number.parseInt(headerValue, 10) : Number.NaN;
	return Number.isInteger(parsed) ? parsed : DEV_USER_ID;
};

@ApiTags("Notification")
@Controller("notifications")
export class NotificationController {
	constructor(private readonly service: NotificationService) {}

	@Get()
	@ZodOk(notificationsResponseSchema)
	async list(@Req() req: RequestWithUser) {
		const userId = userIdFromReq(req);
		return this.service.listForUser(userId);
	}

	@Get(":id")
	@ZodParam(notificationIdParamSchema, "id")
	@ZodOk(notificationSchema)
	async getOne(
		@Param(new ZodValidationPipe(notificationIdParamSchema))
		params: { id: string },
		@Req() req: RequestWithUser,
	) {
		const userId = userIdFromReq(req);
		return this.service.getById(params.id, userId);
	}

	@Delete()
	async clearAll(@Req() req: RequestWithUser) {
		const userId = userIdFromReq(req);
		await this.service.clearAll(userId);
		return { ok: true };
	}

	@Post("test")
	@ZodOk(notificationSchema)
	async createTest(@Body() body: CreateNotificationTestBody) {
		return this.service.create({
			userId: body.userId ?? 1,
			eventId: body.eventId ?? 4,
			kind: body.kind ?? "reminder",
			title: body.title ?? "Test Notification",
			body: body.body ?? "This is a mock notification from the frontend",
			// opcional: metas
			metaOriginalDate: body.meta?.originalDate,
			metaNewDate: body.meta?.newDate,
			metaLocation: body.meta?.location,
		});
	}
}
