import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import {
	NOTIFICATIONS_QUEUE,
	REGISTRATION_CONFIRMATION_JOB,
	SUBSCRIPTION_CREATED_JOB,
} from "./notifications.constants";
import {
	RegistrationConfirmationNotificationPayload,
	SubscriptionCreatedNotificationPayload,
} from "./notifications.types";

@Injectable()
export class NotificationsQueueService {
	private readonly logger = new Logger(NotificationsQueueService.name);

	constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue) {}

	async enqueueSubscriptionCreated(
		payload: SubscriptionCreatedNotificationPayload,
	): Promise<string> {
		const job = await this.queue.add(SUBSCRIPTION_CREATED_JOB, payload, {
			removeOnComplete: true,
			removeOnFail: false,
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 1000,
			},
		});
		this.logger.debug(`Enqueued subscription-created notification for ${payload.eventName}`);
		return job.id as string;
	}

	async enqueueRegistrationConfirmation(
		payload: RegistrationConfirmationNotificationPayload,
	): Promise<string> {
		const job = await this.queue.add(REGISTRATION_CONFIRMATION_JOB, payload, {
			removeOnComplete: true,
			removeOnFail: false,
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 1000,
			},
		});
		this.logger.debug(`Enqueued registration-confirmation notification for ${payload.userEmail}`);
		return job.id as string;
	}

	async getJob(
		jobId: string,
	): Promise<
		Job<SubscriptionCreatedNotificationPayload | RegistrationConfirmationNotificationPayload>
	> {
		const job = await this.queue.getJob(jobId);
		if (!job) {
			throw new NotFoundException(`Notification job ${jobId} not found`);
		}
		return job;
	}

	async getJobState(jobId: string): Promise<{
		id: string;
		state: string;
		failedReason: string | null;
		progress: unknown;
		attemptsMade: number;
		returnvalue: unknown;
	}> {
		const job = await this.getJob(jobId);
		const [state, failedReason, progress, attemptsMade, returnvalue] = await Promise.all([
			job.getState(),
			job.failedReason ?? null,
			job.progress,
			job.attemptsMade,
			job.returnvalue,
		]);

		return {
			id: job.id as string,
			state,
			failedReason,
			progress,
			attemptsMade,
			returnvalue,
		};
	}

	async getQueueCounts(): Promise<Record<string, number>> {
		const counts = await this.queue.getJobCounts(
			"waiting",
			"active",
			"completed",
			"failed",
			"delayed",
		);
		return counts;
	}
}
