import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateNotificationTestSchema,
	createNotificationTestSchema,
	notificationIdParamSchema,
	notificationSchema,
	notificationsResponseSchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodOk,
	ZodParam,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserRequest } from "@/types/user.request";
import { NotificationService } from "./notification.service";

@ApiTags("Notification")
@Controller("notifications")
export class NotificationController {
	constructor(private readonly service: NotificationService) {}

	@Get()
	@ZodOk(notificationsResponseSchema)
	async list(@Req() req: UserRequest) {
		const userId = req.user.id;
		return this.service.listForUser(userId);
	}

	@Get(":id")
	@ZodParam(notificationIdParamSchema, "id")
	@ZodOk(notificationSchema)
	async getOne(
		@Param(new ZodValidationPipe(notificationIdParamSchema))
		params: { id: string },
		@Req() req: UserRequest,
	) {
		const userId = req.user.id;
		return this.service.getById(params.id, userId);
	}

	@Delete()
	async clearAll(@Req() req: UserRequest) {
		const userId = req.user.id;
		await this.service.clearAll(userId);
		return { ok: true };
	}

	@Post("test")
	@ZodBody(createNotificationTestSchema)
	@ZodOk(notificationSchema)
	async createTest(
		@Body(new ZodValidationPipe(createNotificationTestSchema)) body: CreateNotificationTestSchema,
		@Req() req: UserRequest,
	) {
		return this.service.create(body, req.user.id);
	}
}
