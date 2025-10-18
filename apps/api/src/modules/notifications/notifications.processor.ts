import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { EmailService } from "../email/email.service";
import { NOTIFICATIONS_QUEUE } from "./notifications.constants";
import { SubscriptionCreatedNotificationPayload } from "./notifications.types";

@Processor(NOTIFICATIONS_QUEUE)
@Injectable()
export class NotificationsProcessor extends WorkerHost {
	private readonly logger = new Logger(NotificationsProcessor.name);

	constructor(private readonly emailService: EmailService) {
		super();
	}

	async process(job: Job<SubscriptionCreatedNotificationPayload>): Promise<void> {
		const { creatorEmail, creatorName, eventName, subscriberName } = job.data;

		const subject = `New subscription for ${eventName}`;
		const html = `<div>
			<p>Hi ${creatorName},</p>
			<p>${subscriberName} just subscribed to your event <strong>${eventName}</strong>.</p>
		</div>`;

		try {
			await this.emailService.sendEmail([creatorEmail], subject, html);
			this.logger.log(`Notification email sent to ${creatorEmail} for event ${eventName}`);
		} catch (error) {
			this.logger.error(
				`Failed to send notification email to ${creatorEmail} for event ${eventName}`,
				error instanceof Error ? error.stack : undefined,
			);
			throw error;
		}
	}
}
