import { Logger, NotFoundException } from "@nestjs/common";
import type { Job, Queue } from "bullmq";
import type { EmailService } from "../email/email.service";
import { REGISTRATION_CONFIRMATION_JOB, SUBSCRIPTION_CREATED_JOB } from "./notifications.constants";
import { NotificationsController } from "./notifications.controller";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsQueueService } from "./notifications.service";

describe("NotificationsQueueService", () => {
	const mockQueue: jest.Mocked<Pick<Queue, "add" | "getJob" | "getJobCounts">> = {
		add: jest.fn(),
		getJob: jest.fn(),
		getJobCounts: jest.fn(),
	};
	let service: NotificationsQueueService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new NotificationsQueueService(mockQueue as unknown as Queue);
	});

	it("enqueues subscription-created notifications", async () => {
		mockQueue.add.mockResolvedValue({ id: "job-1" } as Job);
		const payload = {
			creatorEmail: "creator@test.com",
			creatorName: "Creator",
			eventName: "Event",
			subscriberName: "User",
		};

		const jobId = await service.enqueueSubscriptionCreated(payload);

		expect(jobId).toBe("job-1");
		expect(mockQueue.add).toHaveBeenCalledWith(
			SUBSCRIPTION_CREATED_JOB,
			payload,
			expect.objectContaining({ attempts: 3, removeOnComplete: true }),
		);
	});

	it("enqueues registration confirmation notifications", async () => {
		mockQueue.add.mockResolvedValue({ id: "job-2" } as Job);
		const payload = { userEmail: "user@test.com", userName: "User" };

		const jobId = await service.enqueueRegistrationConfirmation(payload);

		expect(jobId).toBe("job-2");
		expect(mockQueue.add).toHaveBeenCalledWith(
			REGISTRATION_CONFIRMATION_JOB,
			payload,
			expect.objectContaining({ backoff: expect.objectContaining({ type: "exponential" }) }),
		);
	});

	it("throws when job is not found", async () => {
		mockQueue.getJob.mockResolvedValue(undefined);

		await expect(service.getJob("missing")).rejects.toThrow(NotFoundException);
	});

	it("returns job state details", async () => {
		const job = {
			id: "job-3",
			getState: jest.fn().mockResolvedValue("completed"),
			failedReason: null,
			progress: { current: 1 },
			attemptsMade: 2,
			returnvalue: { ok: true },
		} as unknown as Job;
		jest.spyOn(service, "getJob").mockResolvedValue(job as Job);

		const result = await service.getJobState("job-3");

		expect(service.getJob).toHaveBeenCalledWith("job-3");
		expect(result).toEqual({
			id: "job-3",
			state: "completed",
			failedReason: null,
			progress: { current: 1 },
			attemptsMade: 2,
			returnvalue: { ok: true },
		});
	});

	it("returns queue counts", async () => {
		mockQueue.getJobCounts.mockResolvedValue({ waiting: 1, active: 0 });

		const result = await service.getQueueCounts();

		expect(mockQueue.getJobCounts).toHaveBeenCalledWith(
			"waiting",
			"active",
			"completed",
			"failed",
			"delayed",
		);
		expect(result).toEqual({ waiting: 1, active: 0 });
	});
});

describe("NotificationsProcessor", () => {
	const mockEmailService = {
		sendEmail: jest.fn(),
	};
	let processor: NotificationsProcessor;

	beforeEach(() => {
		jest.clearAllMocks();
		processor = new NotificationsProcessor(mockEmailService as unknown as EmailService);
	});

	it("processes subscription created jobs", async () => {
		const payload = {
			creatorEmail: "creator@test.com",
			creatorName: "Creator",
			eventName: "Event",
			subscriberName: "User",
		};
		const job = { name: SUBSCRIPTION_CREATED_JOB, data: payload } as Job;
		mockEmailService.sendEmail.mockResolvedValue(undefined);

		await processor.process(job);

		expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
			["creator@test.com"],
			expect.stringContaining("Event"),
			expect.stringContaining("User"),
		);
	});

	it("processes registration confirmation jobs", async () => {
		const payload = { userEmail: "user@test.com", userName: "User" };
		const job = { name: REGISTRATION_CONFIRMATION_JOB, data: payload } as Job;
		mockEmailService.sendEmail.mockResolvedValue(undefined);

		await processor.process(job);

		expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
			["user@test.com"],
			expect.stringContaining("Registration"),
			expect.stringContaining("User"),
		);
	});

	it("logs a warning for unknown jobs", async () => {
		const warnSpy = jest
			.spyOn((processor as unknown as { logger: Logger }).logger, "warn")
			.mockImplementation(() => {});

		await processor.process({ name: "unknown", data: {} } as Job);

		expect(warnSpy).toHaveBeenCalledWith("Unknown job type: unknown");
	});

	it("propagates sendEmail errors", async () => {
		const payload = {
			creatorEmail: "creator@test.com",
			creatorName: "Creator",
			eventName: "Event",
			subscriberName: "User",
		};
		const job = { name: SUBSCRIPTION_CREATED_JOB, data: payload } as Job;
		const errorSpy = jest
			.spyOn((processor as unknown as { logger: Logger }).logger, "error")
			.mockImplementation(() => {});
		mockEmailService.sendEmail.mockRejectedValue(new Error("email failure"));

		await expect(processor.process(job)).rejects.toThrow("email failure");
		expect(errorSpy).toHaveBeenCalled();
	});
});

describe("NotificationsController", () => {
	const mockQueueService = {
		enqueueSubscriptionCreated: jest.fn(),
		getJobState: jest.fn(),
		getQueueCounts: jest.fn(),
	};
	let controller: NotificationsController;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new NotificationsController(
			mockQueueService as unknown as NotificationsQueueService,
		);
	});

	it("enqueues a test notification", async () => {
		mockQueueService.enqueueSubscriptionCreated.mockResolvedValue("job-123");
		const payload = {
			creatorEmail: "creator@test.com",
			creatorName: "Creator",
			eventName: "Event",
			subscriberName: "User",
		};

		const result = await controller.enqueueTestNotification(payload);

		expect(result).toEqual({ queued: true, payload, jobId: "job-123" });
		expect(mockQueueService.enqueueSubscriptionCreated).toHaveBeenCalledWith(payload);
	});

	it("returns job status for test notifications", async () => {
		mockQueueService.getJobState.mockResolvedValue({ id: "job-1", state: "completed" });

		const result = await controller.getTestNotificationStatus({ jobId: "job-1" });

		expect(result).toEqual({ id: "job-1", state: "completed" });
		expect(mockQueueService.getJobState).toHaveBeenCalledWith("job-1");
	});

	it("returns queue overview", async () => {
		mockQueueService.getQueueCounts.mockResolvedValue({ waiting: 2 });

		const result = await controller.getQueueOverview();

		expect(result).toEqual({ waiting: 2 });
	});
});
