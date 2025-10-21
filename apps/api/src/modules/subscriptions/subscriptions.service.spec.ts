import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SubscriptionResponseSchema } from "@repo/schemas";
import { DATABASE_CONNECTION } from "../database/connection";
import { NotificationsQueueService } from "../notifications/notifications.service";
import { SubscriptionsService } from "./subscriptions.service";

describe("SubscriptionsService", () => {
	let service: SubscriptionsService;

	const mockDb = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn(),
		orderBy: jest.fn().mockReturnThis(),
		innerJoin: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		$count: jest.fn(),
		transaction: jest.fn(),
	};

	const mockSubscription: SubscriptionResponseSchema = {
		id: "sub-123",
		userId: "user-123",
		eventId: "event-123",
		status: "registered",
		position: null,
	};

	const mockEvent = {
		id: "event-123",
		name: "Test Event",
		description: "Test Description",
		startDate: new Date("2025-12-01"),
		endDate: new Date("2025-12-02"),
		quota: 10,
		opensAt: new Date("2024-01-01"),
		closesAt: new Date("2025-12-01"),
		unregisterClosesAt: new Date("2025-11-30"),
		createdBy: "user-456",
		locationId: "location-123",
		groupId: "group-123",
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	};

	const mockEventCreator = {
		id: "user-456",
		name: "Event Creator",
		email: "creator@example.com",
	};

	const mockSubscriberUser = {
		id: "user-123",
		name: "Subscriber User",
		email: "subscriber@example.com",
	};

	const mockNotificationsQueue = {
		enqueueSubscriptionCreated: jest.fn(),
		getJob: jest.fn(),
		getJobState: jest.fn(),
		getQueueCounts: jest.fn(),
	} as unknown as jest.Mocked<NotificationsQueueService>;

	beforeEach(async () => {
		// Setup transaction mock implementation
		mockDb.transaction.mockImplementation((callback) => {
			const mockTransaction = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				returning: jest.fn().mockReturnThis(),
				insert: jest.fn().mockReturnThis(),
				values: jest.fn().mockReturnThis(),
				$count: jest.fn(),
			};
			return callback(mockTransaction);
		});

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SubscriptionsService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: NotificationsQueueService,
					useValue: mockNotificationsQueue,
				},
			],
		}).compile();

		service = module.get<SubscriptionsService>(SubscriptionsService);
		mockNotificationsQueue.enqueueSubscriptionCreated.mockResolvedValue("job-123");
	});

	describe("getUserSubscribedEvents", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("should return formatted events for the authenticated user", async () => {
			const userId = "user-123";
			const rawRow = {
				subscriptionId: "sub-1",
				id: "event-1",
				name: "Event 1",
				startDate: new Date("2025-09-21T19:45:00Z"),
				locationName: "Main Hall",
			};
			(mockDb.where as jest.Mock).mockResolvedValueOnce([rawRow]);

			const result = await service.getUserSubscribedEvents(userId);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.innerJoin).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual([
				{
					subscriptionId: rawRow.subscriptionId,
					id: rawRow.id,
					name: rawRow.name,
					startDate: rawRow.startDate.toISOString(),
					location: { name: rawRow.locationName },
				},
			]);
		});

		it("should return empty array when no subscribed events found", async () => {
			(mockDb.where as jest.Mock).mockResolvedValueOnce([]);

			const result = await service.getUserSubscribedEvents("user-123");

			expect(result).toEqual([]);
		});
	});

	describe("getUserSubscriptions", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("should return user subscriptions without filters", async () => {
			const mockResult = [mockSubscription];
			(mockDb.where as jest.Mock).mockResolvedValue(mockResult);

			const result = await service.getUserSubscriptions("user-123");

			expect(result).toEqual(mockResult);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it("should return user subscriptions with status filter", async () => {
			const mockResult = [mockSubscription];
			(mockDb.where as jest.Mock).mockResolvedValue(mockResult);

			const result = await service.getUserSubscriptions("user-123", { status: "registered" });

			expect(result).toEqual(mockResult);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it("should return user subscriptions with eventId filter", async () => {
			const mockResult = [mockSubscription];
			(mockDb.where as jest.Mock).mockResolvedValue(mockResult);

			const result = await service.getUserSubscriptions("user-123", { eventId: "event-123" });

			expect(result).toEqual(mockResult);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it("should throw NotFoundException when no subscriptions found", async () => {
			(mockDb.where as jest.Mock).mockResolvedValue(null);

			await expect(service.getUserSubscriptions("user-123")).rejects.toThrow(NotFoundException);
		});
	});

	describe("getSubscriptionById", () => {
		beforeEach(() => {
			jest.clearAllMocks();
			// Setup the chain specifically for getSubscriptionById
			const mockChain = {
				limit: jest.fn(),
			};
			(mockDb.where as jest.Mock).mockReturnValue(mockChain);
		});

		it("should return subscription when found", async () => {
			// Get the mock chain returned by where
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([mockSubscription]);

			const result = await service.getSubscriptionById("sub-123", "user-123");

			expect(result).toEqual(mockSubscription);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockChain.limit).toHaveBeenCalledWith(1);
		});

		it("should throw NotFoundException when subscription not found", async () => {
			// Get the mock chain returned by where
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([]);

			await expect(service.getSubscriptionById("sub-123", "user-123")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("getEventAlreadyRegistered", () => {
		beforeEach(() => {
			jest.clearAllMocks();
			const mockChain = {
				limit: jest.fn(),
			};
			(mockDb.where as jest.Mock).mockReturnValue(mockChain);
		});

		it("should return subscription id when user is already registered for event", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([{ id: "sub-123" }]);

			const result = await service.getEventAlreadyRegistered("event-123", "user-123");

			expect(result).toEqual({ id: "sub-123" });
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockChain.limit).toHaveBeenCalledWith(1);
		});

		it("should throw NotFoundException when user is not registered for event", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([]);

			await expect(service.getEventAlreadyRegistered("event-123", "user-123")).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.getEventAlreadyRegistered("event-123", "user-123")).rejects.toThrow(
				"Subscription not found",
			);
		});
	});

	describe("getEventStats", () => {
		beforeEach(() => {
			jest.clearAllMocks();
			// Setup the chain for getEventStats
			const mockChain = {
				limit: jest.fn(),
			};
			(mockDb.where as jest.Mock).mockReturnValue(mockChain);
		});

		it("should return event statistics with registered and waitlisted counts", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([mockEvent]);
			(mockDb.$count as jest.Mock)
				.mockResolvedValueOnce(18) // Registered count
				.mockResolvedValueOnce(5); // Waitlisted count

			const result = await service.getEventStats("event-123");

			expect(result).toEqual({
				eventId: "event-123",
				registeredCount: 18,
				waitlistedCount: 5,
				spotsLeft: 0, // quota (10) - registered (18) = -8, clamped to 0 by Math.max
			});
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.$count).toHaveBeenCalledTimes(2);
		});

		it("should return correct spots left when event is not full", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([mockEvent]);
			(mockDb.$count as jest.Mock)
				.mockResolvedValueOnce(7) // Registered count
				.mockResolvedValueOnce(2); // Waitlisted count

			const result = await service.getEventStats("event-123");

			expect(result).toEqual({
				eventId: "event-123",
				registeredCount: 7,
				waitlistedCount: 2,
				spotsLeft: 3, // quota (10) - registered (7) = 3
			});
		});

		it("should return 0 spots left when event is full", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([mockEvent]);
			(mockDb.$count as jest.Mock)
				.mockResolvedValueOnce(10) // Registered count equals quota
				.mockResolvedValueOnce(3); // Waitlisted count

			const result = await service.getEventStats("event-123");

			expect(result).toEqual({
				eventId: "event-123",
				registeredCount: 10,
				waitlistedCount: 3,
				spotsLeft: 0, // quota (10) - registered (10) = 0
			});
		});

		it("should handle zero counts correctly", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([mockEvent]);
			(mockDb.$count as jest.Mock)
				.mockResolvedValueOnce(0) // No registered
				.mockResolvedValueOnce(0); // No waitlisted

			const result = await service.getEventStats("event-123");

			expect(result).toEqual({
				eventId: "event-123",
				registeredCount: 0,
				waitlistedCount: 0,
				spotsLeft: 10, // quota (10) - registered (0) = 10
			});
		});

		it("should handle null counts from database", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([mockEvent]);
			(mockDb.$count as jest.Mock)
				.mockResolvedValueOnce(null) // Null registered count
				.mockResolvedValueOnce(null); // Null waitlisted count

			const result = await service.getEventStats("event-123");

			expect(result).toEqual({
				eventId: "event-123",
				registeredCount: 0,
				waitlistedCount: 0,
				spotsLeft: 10,
			});
		});

		it("should throw NotFoundException when event does not exist", async () => {
			const mockChain = (mockDb.where as jest.Mock)();
			(mockChain.limit as jest.Mock).mockResolvedValue([]);

			await expect(service.getEventStats("event-123")).rejects.toThrow(NotFoundException);
			await expect(service.getEventStats("event-123")).rejects.toThrow("Event not found");
		});
	});

	describe("createSubscription", () => {
		let mockTransaction: typeof mockDb;

		beforeEach(() => {
			jest.clearAllMocks();
			mockTransaction = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				returning: jest.fn().mockReturnThis(),
				insert: jest.fn().mockReturnThis(),
				values: jest.fn().mockReturnThis(),
				$count: jest.fn(),
			} as unknown as jest.Mocked<typeof mockDb>;

			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));
			mockNotificationsQueue.enqueueSubscriptionCreated.mockResolvedValue("job-123");
		});

		it("should return existing subscription if user already registered", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([mockSubscription]) // existing subscription
				.mockResolvedValueOnce([mockEvent]) // event
				.mockResolvedValueOnce([mockEventCreator]) // event creator
				.mockResolvedValueOnce([mockSubscriberUser]); // subscriber details

			const result = await service.createSubscription("user-123", { eventId: "event-123" });

			expect(result).toEqual({
				id: mockSubscription.id,
				userId: mockSubscription.userId,
				eventId: mockSubscription.eventId,
				status: mockSubscription.status,
				position: mockSubscription.position,
			});
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).not.toHaveBeenCalled();
		});

		it("should create new subscription when user not already registered", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([mockEvent]) // Event exists
				.mockResolvedValueOnce([mockEventCreator]) // event creator
				.mockResolvedValueOnce([mockSubscriberUser]); // subscriber

			(mockTransaction.$count as jest.Mock).mockResolvedValue(5); // Registration count
			(mockTransaction.returning as jest.Mock).mockResolvedValue([mockSubscription]);

			const result = await service.createSubscription("user-123", { eventId: "event-123" });

			expect(result).toEqual({
				id: mockSubscription.id,
				userId: mockSubscription.userId,
				eventId: mockSubscription.eventId,
				status: mockSubscription.status,
				position: mockSubscription.position,
			});
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).toHaveBeenCalledTimes(1);
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).toHaveBeenCalledWith(
				expect.objectContaining({
					creatorEmail: mockEventCreator.email,
					creatorName: mockEventCreator.name,
					eventName: mockEvent.name,
					subscriberName: mockSubscriberUser.name,
				}),
			);
		});

		it("should create waitlisted subscription when event is full", async () => {
			const waitlistedSubscription = { ...mockSubscription, status: "waitlisted", position: 3 };

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([mockEvent]) // Event exists
				.mockResolvedValueOnce([mockEventCreator]) // event creator
				.mockResolvedValueOnce([mockSubscriberUser]) // subscriber
				.mockResolvedValueOnce([{ max: 2 }]); // Max position in waitlist

			(mockTransaction.$count as jest.Mock).mockResolvedValue(10); // Registration count equals quota
			(mockTransaction.returning as jest.Mock).mockResolvedValue([waitlistedSubscription]);

			const result = await service.createSubscription("user-123", { eventId: "event-123" });

			expect(result.status).toBe("waitlisted");
			expect(result.position).toBe(3);
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).toHaveBeenCalledTimes(1);
		});

		it("should throw NotFoundException when event does not exist", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([]); // Event does not exist

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow(NotFoundException);
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).not.toHaveBeenCalled();
		});

		it("should throw ForbiddenException when registration not yet open", async () => {
			const futureEvent = { ...mockEvent, opensAt: new Date("2026-01-01") };

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([futureEvent]) // Event exists but registration not open
				.mockResolvedValueOnce([mockEventCreator])
				.mockResolvedValueOnce([mockSubscriberUser]);

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow(ForbiddenException);
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).not.toHaveBeenCalled();
		});

		it("should throw ForbiddenException when registration has closed", async () => {
			const pastEvent = { ...mockEvent, closesAt: new Date("2023-01-01") };

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([pastEvent]) // Event exists but registration closed
				.mockResolvedValueOnce([mockEventCreator])
				.mockResolvedValueOnce([mockSubscriberUser]);

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow(ForbiddenException);
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).not.toHaveBeenCalled();
		});

		it("should throw Error when insert fails", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([mockEvent]) // Event exists
				.mockResolvedValueOnce([mockEventCreator])
				.mockResolvedValueOnce([mockSubscriberUser]);

			(mockTransaction.$count as jest.Mock).mockResolvedValue(5);
			(mockTransaction.returning as jest.Mock).mockResolvedValue([]); // Insert fails

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow("Failed to create subscription");
			expect(mockNotificationsQueue.enqueueSubscriptionCreated).not.toHaveBeenCalled();
		});
	});

	describe("updateSubscription", () => {
		let mockTransaction: typeof mockDb;

		beforeEach(() => {
			jest.clearAllMocks();
			mockTransaction = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				returning: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
			} as unknown as jest.Mocked<typeof mockDb>;

			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));
		});

		it("should update subscription status", async () => {
			const waitlistedSubscription = { ...mockSubscription, status: "waitlisted" };
			const waitlistedJoinedResult = {
				subscription: waitlistedSubscription,
				event: mockEvent,
			};
			const updatedSubscription = { ...waitlistedSubscription, status: "cancelled" };

			(mockTransaction.limit as jest.Mock).mockResolvedValue([waitlistedJoinedResult]);
			(mockTransaction.returning as jest.Mock).mockResolvedValue([updatedSubscription]);

			const result = await service.updateSubscription("sub-123", "user-123", {
				status: "cancelled",
			});

			expect(result.status).toBe("cancelled");
		});

		it("should promote from waitlist when registered user cancels", async () => {
			const registeredSubscription = { ...mockSubscription, status: "registered" };
			const joinedResult = {
				subscription: registeredSubscription,
				event: mockEvent,
			};

			const nextWaitlistedUser = {
				id: "sub-456",
				userId: "user-456",
				eventId: "event-123",
				status: "waitlisted",
				position: 1,
			};

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([joinedResult]) // Get subscription with event
				.mockResolvedValueOnce([nextWaitlistedUser]); // Get next waitlisted user

			(mockTransaction.returning as jest.Mock).mockResolvedValue([
				{ ...registeredSubscription, status: "cancelled" },
			]);

			const result = await service.updateSubscription("sub-123", "user-123", {
				status: "cancelled",
			});

			expect(result.status).toBe("cancelled");
		});

		it("should throw NotFoundException when subscription not found", async () => {
			(mockTransaction.limit as jest.Mock).mockResolvedValue([]);

			await expect(
				service.updateSubscription("sub-123", "user-123", { status: "cancelled" }),
			).rejects.toThrow(NotFoundException);
		});

		it("should throw ForbiddenException when unregistration period has closed", async () => {
			const pastEvent = { ...mockEvent, unregisterClosesAt: new Date("2023-01-01") };
			const joinedResult = {
				subscription: mockSubscription,
				event: pastEvent,
			};

			(mockTransaction.limit as jest.Mock).mockResolvedValue([joinedResult]);

			await expect(
				service.updateSubscription("sub-123", "user-123", { status: "cancelled" }),
			).rejects.toThrow(ForbiddenException);
		});

		it("should throw NotFoundException when update fails", async () => {
			const waitlistedSubscription = { ...mockSubscription, status: "waitlisted" };
			const waitlistedJoinedResult = {
				subscription: waitlistedSubscription,
				event: mockEvent,
			};

			(mockTransaction.limit as jest.Mock).mockResolvedValue([waitlistedJoinedResult]);
			(mockTransaction.returning as jest.Mock).mockResolvedValue([]);

			await expect(
				service.updateSubscription("sub-123", "user-123", { status: "cancelled" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("deleteSubscription", () => {
		let mockTransaction: typeof mockDb;
		const _mockJoinedResult = {
			subscription: mockSubscription,
			event: mockEvent,
		};

		beforeEach(() => {
			jest.clearAllMocks();
			mockTransaction = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
			} as unknown as jest.Mocked<typeof mockDb>;

			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));
		});

		it("should soft delete subscription", async () => {
			const waitlistedSubscription = { ...mockSubscription, status: "waitlisted" };
			const waitlistedJoinedResult = {
				subscription: waitlistedSubscription,
				event: mockEvent,
			};

			(mockTransaction.limit as jest.Mock).mockResolvedValue([waitlistedJoinedResult]);

			const result = await service.deleteSubscription("sub-123", "user-123");

			expect(result).toStrictEqual({ message: "Subscription cancelled successfully" });
			expect(mockTransaction.update).toHaveBeenCalled();
		});

		it("should promote from waitlist when registered user deletes", async () => {
			const registeredSubscription = { ...mockSubscription, status: "registered" };
			const joinedResult = {
				subscription: registeredSubscription,
				event: mockEvent,
			};

			const nextWaitlistedUser = {
				id: "sub-456",
				userId: "user-456",
				eventId: "event-123",
				status: "waitlisted",
				position: 1,
			};

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([joinedResult]) // Get subscription with event
				.mockResolvedValueOnce([nextWaitlistedUser]); // Get next waitlisted user

			const result = await service.deleteSubscription("sub-123", "user-123");

			expect(result).toStrictEqual({ message: "Subscription cancelled successfully" });
		});

		it("should throw NotFoundException when subscription not found", async () => {
			(mockTransaction.limit as jest.Mock).mockResolvedValue([]);

			await expect(service.deleteSubscription("sub-123", "user-123")).rejects.toThrow(
				NotFoundException,
			);
		});

		it("should throw ForbiddenException when unregistration period has closed", async () => {
			const pastEvent = { ...mockEvent, unregisterClosesAt: new Date("2023-01-01") };
			const joinedResult = {
				subscription: mockSubscription,
				event: pastEvent,
			};

			(mockTransaction.limit as jest.Mock).mockResolvedValue([joinedResult]);

			await expect(service.deleteSubscription("sub-123", "user-123")).rejects.toThrow(
				ForbiddenException,
			);
		});
	});

	describe("promoteFromWaitlist (private method tested via public methods)", () => {
		let mockTransaction: typeof mockDb;

		beforeEach(() => {
			jest.clearAllMocks();
			mockTransaction = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				returning: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
			} as unknown as jest.Mocked<typeof mockDb>;

			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));
		});

		it("should handle case when no waitlisted users exist", async () => {
			const registeredSubscription = { ...mockSubscription, status: "registered" };
			const joinedResult = {
				subscription: registeredSubscription,
				event: mockEvent,
			};

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([joinedResult]) // Get subscription with event
				.mockResolvedValueOnce([]); // No waitlisted users

			(mockTransaction.returning as jest.Mock).mockResolvedValue([
				{ ...registeredSubscription, status: "cancelled" },
			]);

			const result = await service.updateSubscription("sub-123", "user-123", {
				status: "cancelled",
			});

			expect(result.status).toBe("cancelled");
		});

		it("should throw error when next waitlisted user has no position", async () => {
			const registeredSubscription = { ...mockSubscription, status: "registered" };
			const joinedResult = {
				subscription: registeredSubscription,
				event: mockEvent,
			};

			const waitlistedUserNoPosition = {
				id: "sub-456",
				userId: "user-456",
				eventId: "event-123",
				status: "waitlisted",
				position: null,
			};

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([joinedResult]) // Get subscription with event
				.mockResolvedValueOnce([waitlistedUserNoPosition]); // Waitlisted user with no position

			await expect(
				service.updateSubscription("sub-123", "user-123", { status: "cancelled" }),
			).rejects.toThrow("Next waitlisted user has no position");
		});
	});
});
