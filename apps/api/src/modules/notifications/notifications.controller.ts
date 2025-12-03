/* istanbul ignore file */
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SubscriptionCreatedTestPayload, subscriptionCreatedSchema, z } from "@repo/schemas";
import { ZodBody, ZodParam, ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";
import { NotificationsQueueService } from "./notifications.service";

const notificationJobIdParamSchema = z.object({
	jobId: z.string().min(1),
});

@Controller("notifications")
export class NotificationsController {
	constructor(private readonly notificationsQueue: NotificationsQueueService) {}

	@Post("test")
	@ZodBody(subscriptionCreatedSchema)
	async enqueueTestNotification(
		@Body(new ZodValidationPipe(subscriptionCreatedSchema))
		payload: SubscriptionCreatedTestPayload,
	): Promise<{ queued: true; payload: SubscriptionCreatedTestPayload; jobId: string }> {
		const jobId = await this.notificationsQueue.enqueueSubscriptionCreated(payload);
		return { queued: true, payload, jobId };
	}

	@Get("test/:jobId")
	@ZodParam(notificationJobIdParamSchema, "jobId")
	async getTestNotificationStatus(
		@Param(new ZodValidationPipe(notificationJobIdParamSchema)) { jobId }: { jobId: string },
	) {
		return this.notificationsQueue.getJobState(jobId);
	}

	@Get("test")
	async getQueueOverview() {
		return this.notificationsQueue.getQueueCounts();
	}
}
