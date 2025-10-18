import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "@repo/schemas";
import { NotificationsQueueService } from "./notifications.service";

const subscriptionCreatedSchema = z.object({
	creatorEmail: z.string().email(),
	creatorName: z.string().min(1),
	eventName: z.string().min(1),
	subscriberName: z.string().min(1),
});

type SubscriptionCreatedTestPayload = z.infer<typeof subscriptionCreatedSchema>;

@Controller("notifications")
export class NotificationsController {
	constructor(private readonly notificationsQueue: NotificationsQueueService) {}

	@Post("test")
	async enqueueTestNotification(
		@Body() body: unknown,
	): Promise<{ queued: true; payload: SubscriptionCreatedTestPayload; jobId: string }> {
		const parsed = subscriptionCreatedSchema.safeParse(body);

		if (!parsed.success) {
			throw new BadRequestException(parsed.error.flatten().fieldErrors);
		}

		const payload = parsed.data;
		const jobId = await this.notificationsQueue.enqueueSubscriptionCreated(payload);
		return { queued: true, payload, jobId };
	}

	@Get("test/:jobId")
	async getTestNotificationStatus(@Param("jobId") jobId: string) {
		return this.notificationsQueue.getJobState(jobId);
	}

	@Get("test")
	async getQueueOverview() {
		return this.notificationsQueue.getQueueCounts();
	}
}
