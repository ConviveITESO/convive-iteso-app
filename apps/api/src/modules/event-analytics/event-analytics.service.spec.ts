import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { EventAnalyticsService } from "./event-analytics.service";

describe("EventAnalyticsService", () => {
	let service: EventAnalyticsService;

	const mockDb = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		innerJoin: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		execute: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [EventAnalyticsService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<EventAnalyticsService>(EventAnalyticsService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getParticipants", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("throws NotFoundException when event does not exist", async () => {
			(mockDb.limit as jest.Mock).mockResolvedValueOnce([]);
			await expect(service.getParticipants("event-1")).rejects.toThrow(NotFoundException);
		});

		it("returns participants rows with event quota", async () => {
			const eventRow = [{ id: "event-1", quota: 10 }];
			const rows = [
				{
					userId: "u1",
					userName: "User One",
					subscriptionStatus: "registered",
					eventQuota: 10,
				},
				{
					userId: "u2",
					userName: "User Two",
					subscriptionStatus: "waitlisted",
					eventQuota: 10,
				},
			];

			// First query (event exists)
			(mockDb.limit as jest.Mock).mockResolvedValueOnce(eventRow);
			// Second query (participants)
			(mockDb.orderBy as jest.Mock).mockResolvedValueOnce(rows);

			const result = await service.getParticipants("event-1");
			expect(result).toEqual(rows);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
		});

		it("returns empty array when event exists but no participants", async () => {
			const eventRow = [{ id: "event-1", quota: 10 }];
			(mockDb.limit as jest.Mock).mockResolvedValueOnce(eventRow); // event exists
			(mockDb.orderBy as jest.Mock).mockResolvedValueOnce([]); // no participant rows

			const result = await service.getParticipants("event-1");
			expect(result).toEqual([]);
		});
	});

	describe("getChart", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it("throws NotFoundException when event does not exist", async () => {
			(mockDb.limit as jest.Mock).mockResolvedValueOnce([]);
			await expect(service.getChart("event-1")).rejects.toThrow(NotFoundException);
		});

		it("returns chart slices with counts and remaining quota", async () => {
			// Event exists
			(mockDb.limit as jest.Mock).mockResolvedValueOnce([{ id: "event-1", quota: 10 }]);
			// Status counts
			(mockDb.execute as jest.Mock)
				.mockResolvedValueOnce({
					rows: [
						{ status: "registered", count: 6 },
						{ status: "waitlisted", count: 2 },
						{ status: "attended", count: 1 },
						{ status: "cancelled", count: 1 },
					],
				})
				// Total subscriptions
				.mockResolvedValueOnce({ rows: [{ total: 10 }] });

			const result = await service.getChart("event-1");
			expect(result).toEqual([
				{ name: "registered", count: 6 },
				{ name: "cancelled", count: 1 },
				{ name: "waitlisted", count: 2 },
				{ name: "attended", count: 1 },
				{ name: "quota", count: 0 }, // quota - totalSubscriptions => 10 - 10 = 0
			]);
		});

		it("fills missing statuses with zero and clamps quota to zero when oversubscribed", async () => {
			// Event exists
			(mockDb.limit as jest.Mock).mockResolvedValueOnce([{ id: "event-1", quota: 3 }]);
			// Only registered present
			(mockDb.execute as jest.Mock)
				.mockResolvedValueOnce({ rows: [{ status: "registered", count: 5 }] })
				.mockResolvedValueOnce({ rows: [{ total: 5 }] }); // oversubscribed

			const result = await service.getChart("event-1");
			expect(result).toEqual([
				{ name: "registered", count: 5 },
				{ name: "cancelled", count: 0 },
				{ name: "waitlisted", count: 0 },
				{ name: "attended", count: 0 },
				{ name: "quota", count: 0 }, // 3 - 5 = -2 => clamp to 0
			]);
		});

		it("ignores unknown status rows (not in counts) and computes quota slice", async () => {
			(mockDb.limit as jest.Mock).mockResolvedValueOnce([{ id: "event-1", quota: 10 }]);
			(mockDb.execute as jest.Mock)
				.mockResolvedValueOnce({ rows: [{ status: "foobar", count: 7 }] }) // unknown status
				.mockResolvedValueOnce({ rows: [{ total: 7 }] });

			const result = await service.getChart("event-1");
			expect(result).toEqual([
				{ name: "registered", count: 0 },
				{ name: "cancelled", count: 0 },
				{ name: "waitlisted", count: 0 },
				{ name: "attended", count: 0 },
				{ name: "quota", count: 3 }, // 10 - 7
			]);
		});

		it("returns all zeros when no status rows and no total rows (quota slice = quota)", async () => {
			(mockDb.limit as jest.Mock).mockResolvedValueOnce([{ id: "event-1", quota: 8 }]);
			(mockDb.execute as jest.Mock)
				.mockResolvedValueOnce({ rows: [] }) // no status rows
				.mockResolvedValueOnce({ rows: [] }); // no total row => totalSubscriptions=0

			const result = await service.getChart("event-1");
			expect(result).toEqual([
				{ name: "registered", count: 0 },
				{ name: "cancelled", count: 0 },
				{ name: "waitlisted", count: 0 },
				{ name: "attended", count: 0 },
				{ name: "quota", count: 8 },
			]);
		});
	});
});
