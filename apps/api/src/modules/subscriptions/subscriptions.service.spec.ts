import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { Subscription } from "../database/schemas";
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

	const mockSubscription: Subscription = {
		id: "sub-123",
		userId: "user-123",
		eventId: "event-123",
		status: "registered",
		position: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		deletedAt: null,
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
			],
		}).compile();

		service = module.get<SubscriptionsService>(SubscriptionsService);
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
		});

		it("should return existing subscription if user already registered", async () => {
			(mockTransaction.limit as jest.Mock).mockResolvedValue([mockSubscription]);

			const result = await service.createSubscription("user-123", { eventId: "event-123" });

			expect(result).toEqual({
				id: mockSubscription.id,
				userId: mockSubscription.userId,
				eventId: mockSubscription.eventId,
				status: mockSubscription.status,
				position: mockSubscription.position,
			});
		});

		it("should create new subscription when user not already registered", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([mockEvent]); // Event exists

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
		});

		it("should create waitlisted subscription when event is full", async () => {
			const waitlistedSubscription = { ...mockSubscription, status: "waitlisted", position: 3 };

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([mockEvent]) // Event exists
				.mockResolvedValueOnce([{ max: 2 }]); // Max position in waitlist

			(mockTransaction.$count as jest.Mock).mockResolvedValue(10); // Registration count equals quota
			(mockTransaction.returning as jest.Mock).mockResolvedValue([waitlistedSubscription]);

			const result = await service.createSubscription("user-123", { eventId: "event-123" });

			expect(result.status).toBe("waitlisted");
			expect(result.position).toBe(3);
		});

		it("should throw NotFoundException when event does not exist", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([]); // Event does not exist

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow(NotFoundException);
		});

		it("should throw ForbiddenException when registration not yet open", async () => {
			const futureEvent = { ...mockEvent, opensAt: new Date("2026-01-01") };

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([futureEvent]); // Event exists but registration not open

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow(ForbiddenException);
		});

		it("should throw ForbiddenException when registration has closed", async () => {
			const pastEvent = { ...mockEvent, closesAt: new Date("2023-01-01") };

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([pastEvent]); // Event exists but registration closed

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow(ForbiddenException);
		});

		it("should throw Error when insert fails", async () => {
			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([]) // No existing subscription
				.mockResolvedValueOnce([mockEvent]); // Event exists

			(mockTransaction.$count as jest.Mock).mockResolvedValue(5);
			(mockTransaction.returning as jest.Mock).mockResolvedValue([]); // Insert fails

			await expect(
				service.createSubscription("user-123", { eventId: "event-123" }),
			).rejects.toThrow("Failed to create subscription");
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

			expect(result).toBe("Subscription cancelled successfully");
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

			expect(result).toBe("Subscription cancelled successfully");
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
