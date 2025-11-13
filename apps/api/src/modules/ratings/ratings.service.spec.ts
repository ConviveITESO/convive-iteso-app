import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { RatingsService } from "./ratings.service";

describe("RatingsService", () => {
	let service: RatingsService;
	const mockDb = {
		query: {
			ratings: {
				findFirst: jest.fn(),
			},
			events: {
				findFirst: jest.fn(),
			},
		},
		insert: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RatingsService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<RatingsService>(RatingsService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getRatingByPrimaryKey", () => {
		it("returns the stored rating", async () => {
			const rating = { eventId: "e1" };
			mockDb.query.ratings.findFirst.mockResolvedValue(rating);

			const result = await service.getRatingByPrimaryKey("user-1", "e1");

			expect(result).toBe(rating);
			expect(mockDb.query.ratings.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("returns undefined when no rating matches", async () => {
			mockDb.query.ratings.findFirst.mockResolvedValue(undefined);

			const result = await service.getRatingByPrimaryKey("user-1", "missing");

			expect(result).toBeUndefined();
		});
	});

	describe("addRatingToEvent", () => {
		it("returns null when the event does not exist", async () => {
			mockDb.query.events.findFirst.mockResolvedValue(undefined);

			const result = await service.addRatingToEvent("missing", "user-1", { score: 5 });

			expect(result).toBeNull();
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it("returns null when the event has not finished", async () => {
			mockDb.query.events.findFirst.mockResolvedValue({
				endDate: new Date(Date.now() + 60_000),
			});

			const result = await service.addRatingToEvent("future-event", "user-1", { score: 5 });

			expect(result).toBeNull();
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it("persists a rating when the event already ended", async () => {
			const created = { eventId: "event-1", userId: "user-1", score: 5 };
			const insertBuilder = {
				values: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([created]),
			};
			mockDb.query.events.findFirst.mockResolvedValue({
				endDate: new Date(Date.now() - 60_000),
			});
			mockDb.insert.mockReturnValue(insertBuilder);

			const result = await service.addRatingToEvent("event-1", "user-1", { score: 5 });

			expect(result).toEqual(created);
			expect(insertBuilder.values).toHaveBeenCalledWith({
				eventId: "event-1",
				userId: "user-1",
				score: 5,
			});
			expect(insertBuilder.returning).toHaveBeenCalled();
		});
	});

	type Rating = Awaited<ReturnType<RatingsService["getRatingByPrimaryKey"]>>;

	describe("updateRatingToEvent", () => {
		it("returns null when the rating does not exist", async () => {
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(undefined);

			const result = await service.updateRatingToEvent("event-1", "user-1", { score: 3 });

			expect(result).toBeNull();
		});

		it("updates the rating when it exists", async () => {
			const existing = { eventId: "event-1", userId: "user-1", score: 1 } as NonNullable<Rating>;
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue(undefined),
			};
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(existing);
			mockDb.update.mockReturnValue(updateBuilder);

			const result = await service.updateRatingToEvent("event-1", "user-1", { score: 4 });

			expect(result?.score).toBe(4);
			expect(updateBuilder.set).toHaveBeenCalledWith({ score: 4 });
			expect(updateBuilder.where).toHaveBeenCalledWith(expect.any(Object));
		});
	});

	describe("deleteRatingFromEvent", () => {
		it("returns null when rating is missing", async () => {
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(undefined);

			const result = await service.deleteRatingFromEvent("user-1", "event-1");

			expect(result).toBeNull();
		});

		it("deletes and returns the rating", async () => {
			const existing = { eventId: "event-1", userId: "user-1", score: 2 } as NonNullable<Rating>;
			const deleteBuilder = {
				where: jest.fn().mockResolvedValue(undefined),
			};
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(existing);
			mockDb.delete.mockReturnValue(deleteBuilder);

			const result = await service.deleteRatingFromEvent("user-1", "event-1");

			expect(result).toEqual(existing);
			expect(deleteBuilder.where).toHaveBeenCalledWith(expect.any(Object));
		});
	});
});
