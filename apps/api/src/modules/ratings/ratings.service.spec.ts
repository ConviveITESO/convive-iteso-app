import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { RatingsService } from "./ratings.service";

describe("RatingsService", () => {
	let service: RatingsService;
	let mockDb: {
		query: {
			ratings: {
				findFirst: jest.Mock;
			};
		};
		insert: jest.Mock;
		values: jest.Mock;
		returning: jest.Mock;
		update: jest.Mock;
		set: jest.Mock;
		where: jest.Mock;
		delete: jest.Mock;
	};

	beforeEach(async () => {
		const mockDatabaseConnection = {
			query: {
				ratings: {
					findFirst: jest.fn(),
				},
			},
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RatingsService,
				{ provide: DATABASE_CONNECTION, useValue: mockDatabaseConnection },
			],
		}).compile();

		service = module.get<RatingsService>(RatingsService);
		mockDb = module.get(DATABASE_CONNECTION);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getRatingByPrimaryKey", () => {
		it("returns rating when found", async () => {
			const rating = {
				userId: "u1",
				eventId: "e1",
				score: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockDb.query.ratings.findFirst.mockResolvedValue(rating);
			const result = await service.getRatingByPrimaryKey("u1", "e1");
			expect(result).toEqual(rating);
			expect(mockDb.query.ratings.findFirst).toHaveBeenCalled();
		});

		it("returns undefined when not found", async () => {
			mockDb.query.ratings.findFirst.mockResolvedValue(undefined);
			const result = await service.getRatingByPrimaryKey("u1", "e1");
			expect(result).toBeUndefined();
		});
	});

	describe("addRatingToEvent", () => {
		it("inserts and returns created rating", async () => {
			const created = { userId: "u1", eventId: "e1", score: 5 };
			(mockDb.returning as unknown as jest.Mock).mockResolvedValue([created]);
			const result = await service.addRatingToEvent("e1", "u1", { score: 5 });
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith({ eventId: "e1", userId: "u1", score: 5 });
			expect(result).toEqual(created);
		});
	});

	describe("updateRatingToEvent", () => {
		it("returns null if rating does not exist", async () => {
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(undefined);
			const result = await service.updateRatingToEvent("e1", "u1", { score: 3 });
			expect(result).toBeNull();
		});

		it("updates and returns the rating when it exists", async () => {
			const existing = {
				userId: "u1",
				eventId: "e1",
				score: 2,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(existing);
			const result = await service.updateRatingToEvent("e1", "u1", { score: 4 });
			expect(result?.score).toBe(4);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith({ score: 4 });
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe("deleteRatingFromEvent", () => {
		it("returns null if rating does not exist", async () => {
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(undefined);
			const result = await service.deleteRatingFromEvent("u1", "e1");
			expect(result).toBeNull();
		});

		it("deletes and returns existing rating", async () => {
			const existing = {
				userId: "u1",
				eventId: "e1",
				score: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			jest.spyOn(service, "getRatingByPrimaryKey").mockResolvedValue(existing);
			const result = await service.deleteRatingFromEvent("u1", "e1");
			expect(result).toEqual(existing);
			expect(mockDb.delete).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});
});
