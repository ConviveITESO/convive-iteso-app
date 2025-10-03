import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { DATABASE_CONNECTION } from "../src/modules/database/connection";
import { DatabaseHealthService } from "../src/modules/database/database-health.service";

jest.mock("@/pipes/zod-validation/zod-validation.pipe", () => {
	const actual = jest.requireActual("@/pipes/zod-validation/zod-validation.pipe");
	class ZodValidationPipeAdapter extends actual.ZodValidationPipe {
		transform(value: unknown, metadata: unknown) {
			if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
				return super.transform((value as { id: unknown }).id, metadata);
			}
			return super.transform(value, metadata);
		}
	}
	return {
		...actual,
		/* biome-ignore lint/style/useNamingConvention: overriding exported pipe */
		ZodValidationPipe: ZodValidationPipeAdapter,
	};
});

describe("SubscriptionsModule (e2e)", () => {
	let app: INestApplication<App>;
	let mockDb: ReturnType<typeof createMockDb>;

	const mockDatabaseHealthService = {
		onModuleInit: jest.fn(),
	};

	const mockSubscriptionResponse = {
		id: "f9f4c3df-2d50-4a7b-86a4-2a1de740a111",
		userId: "7d098d5f-430c-4a4b-a6dc-22f3c5135cdf",
		eventId: "4187f7f6-c29d-4e25-8d77-8e0f63c4b222",
		status: "registered" as const,
		position: null,
	};

	const mockEvent = {
		id: "4187f7f6-c29d-4e25-8d77-8e0f63c4b222",
		name: "Test Event",
		description: "Test Description",
		startDate: new Date("2025-12-01"),
		endDate: new Date("2025-12-02"),
		quota: 10,
		opensAt: new Date("2024-01-01"),
		closesAt: new Date("2025-12-01"),
		unregisterClosesAt: new Date("2025-11-30"),
		createdBy: "2860f60d-0acf-408f-ac06-458b5a82fc33",
		locationId: "b2bf0d5b-1a58-4ec7-a3d4-73a9d5efbb88",
		groupId: "c3b7fa8c-6b73-4f3d-a8d3-74f09aeb0d44",
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	};

	function createMockDb() {
		return {
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
	}

	function createMockTransaction() {
		return {
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
		};
	}

	beforeEach(async () => {
		mockDb = createMockDb();

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(DatabaseHealthService)
			.useValue(mockDatabaseHealthService)
			.overrideProvider(DATABASE_CONNECTION)
			.useValue(mockDb)
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Subscriptions endpoints", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("/subscriptions (GET) should return user subscriptions", () => {
			const mockResult = [mockSubscriptionResponse];
			(mockDb.where as jest.Mock).mockResolvedValue(mockResult);

			return request(app.getHttpServer())
				.get("/subscriptions")
				.expect(200)
				.then(({ body }) => {
					expect(body).toEqual(mockResult);
				});
		});

		it("/subscriptions/:id (GET) should return a subscription by id", () => {
			const mockChain = {
				limit: jest.fn().mockResolvedValue([mockSubscriptionResponse]),
			};
			(mockDb.where as jest.Mock).mockReturnValue(mockChain);

			return request(app.getHttpServer())
				.get(`/subscriptions/${mockSubscriptionResponse.id}`)
				.expect(200)
				.then(({ body }) => {
					expect(body).toEqual(mockSubscriptionResponse);
				});
		});

		it("/subscriptions (POST) should create a subscription", () => {
			const mockTransaction = createMockTransaction();
			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));

			(mockTransaction.limit as jest.Mock)
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([mockEvent]);
			(mockTransaction.$count as jest.Mock).mockResolvedValue(1);
			(mockTransaction.returning as jest.Mock).mockResolvedValue([mockSubscriptionResponse]);

			return request(app.getHttpServer())
				.post("/subscriptions")
				.send({ eventId: mockEvent.id })
				.expect(201)
				.then(({ body }) => {
					expect(body).toEqual(mockSubscriptionResponse);
				});
		});

		it("/subscriptions/:id (PATCH) should update a subscription", () => {
			const mockTransaction = createMockTransaction();
			const waitlistedSubscription = { ...mockSubscriptionResponse, status: "waitlisted" as const };
			const joinedResult = {
				subscription: waitlistedSubscription,
				event: mockEvent,
			};

			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));
			(mockTransaction.limit as jest.Mock).mockResolvedValueOnce([joinedResult]);
			(mockTransaction.returning as jest.Mock).mockResolvedValue([
				{ ...waitlistedSubscription, status: "cancelled" as const },
			]);

			return request(app.getHttpServer())
				.patch(`/subscriptions/${mockSubscriptionResponse.id}`)
				.send({ status: "cancelled" })
				.expect(200)
				.then(({ body }) => {
					expect(body).toEqual({ ...waitlistedSubscription, status: "cancelled" as const });
				});
		});

		it("/subscriptions/:id (DELETE) should cancel a subscription", () => {
			const mockTransaction = createMockTransaction();
			const joinedResult = {
				subscription: { ...mockSubscriptionResponse, status: "waitlisted" as const },
				event: mockEvent,
			};

			(mockDb.transaction as jest.Mock).mockImplementation((callback) => callback(mockTransaction));
			(mockTransaction.limit as jest.Mock).mockResolvedValueOnce([joinedResult]);

			return request(app.getHttpServer())
				.delete(`/subscriptions/${mockSubscriptionResponse.id}`)
				.expect(200)
				.then((res) => {
					expect(res.text).toBe("Subscription cancelled successfully");
				});
		});
	});
});
