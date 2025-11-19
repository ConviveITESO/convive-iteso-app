import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { EmailService } from "../email/email.service";
import {
	NOTIFICATIONS_QUEUE,
	REGISTRATION_CONFIRMATION_JOB,
	SUBSCRIPTION_CREATED_JOB,
} from "./notifications.constants";
import {
	RegistrationConfirmationNotificationPayload,
	SubscriptionCreatedNotificationPayload,
} from "./notifications.types";

@Processor(NOTIFICATIONS_QUEUE)
@Injectable()
export class NotificationsProcessor extends WorkerHost {
	private readonly logger = new Logger(NotificationsProcessor.name);

	constructor(private readonly emailService: EmailService) {
		super();
	}

	async process(
		job: Job<SubscriptionCreatedNotificationPayload | RegistrationConfirmationNotificationPayload>,
	): Promise<void> {
		if (job.name === SUBSCRIPTION_CREATED_JOB) {
			await this.processSubscriptionCreated(job as Job<SubscriptionCreatedNotificationPayload>);
		} else if (job.name === REGISTRATION_CONFIRMATION_JOB) {
			await this.processRegistrationConfirmation(
				job as Job<RegistrationConfirmationNotificationPayload>,
			);
		} else {
			this.logger.warn(`Unknown job type: ${job.name}`);
		}
	}

	private async processSubscriptionCreated(
		job: Job<SubscriptionCreatedNotificationPayload>,
	): Promise<void> {
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

	private async processRegistrationConfirmation(
		job: Job<RegistrationConfirmationNotificationPayload>,
	): Promise<void> {
		const { userEmail, userName } = job.data;

		const subject = "Welcome to Convive ITESO - Registration Confirmed";
		const html = `<div>
			<p>Hi ${userName},</p>
			<p>Welcome to Convive ITESO! Your account has been successfully created.</p>
			<p>You can now start creating and attending events with our community.</p>
			<p>If you have any questions, feel free to reach out to us.</p>
			<p>Happy connecting!</p>
		</div>`;

		try {
			await this.emailService.sendEmail([userEmail], subject, html);
			this.logger.log(`Registration confirmation email sent to ${userEmail}`);
		} catch (error) {
			this.logger.error(
				`Failed to send registration confirmation email to ${userEmail}`,
				error instanceof Error ? error.stack : undefined,
			);
			throw error;
		}
	}
}
