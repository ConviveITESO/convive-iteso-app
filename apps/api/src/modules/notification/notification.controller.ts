import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import {
	notificationIdParamSchema,
	notificationsResponseSchema,
	notificationSchema,
} from "@repo/schemas";
import { ZodOk, ZodParam, ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";

const DEV_USER_ID = 1; // 👈 entero
const userIdFromReq = (req: any): number =>
	typeof req?.user?.id === "number"
		? req.user.id
		: Number(req?.headers?.["x-user-id"] ?? DEV_USER_ID);

@ApiTags("Notification")
@Controller("notifications")
export class NotificationController {
	constructor(private readonly service: NotificationService) {}

	@Get()
	@ZodOk(notificationsResponseSchema)
	async list(@Req() req: any) {
		const userId = userIdFromReq(req);
		return this.service.listForUser(userId);
	}

	@Get(":id")
	@ZodParam(notificationIdParamSchema, "id")
	@ZodOk(notificationSchema)
	async getOne(
		@Param(new ZodValidationPipe(notificationIdParamSchema))
		params: { id: string },
		@Req() req: any,
	) {
		const userId = userIdFromReq(req);
		return this.service.getById(params.id, userId);
	}

	@Delete()
	async clearAll(@Req() req: any) {
		const userId = userIdFromReq(req);
		await this.service.clearAll(userId);
		return { ok: true };
	}

	@Post("test")
	@ZodOk(notificationSchema)
	async createTest(@Body() body: any) {
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
