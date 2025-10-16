import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { Badge } from "../database/schemas";
import { BadgeService } from "./badge.service";

describe("BadgeService", () => {
	let service: BadgeService;
	const mockDb = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BadgeService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();
		service = module.get<BadgeService>(BadgeService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("assertBadgesExist", () => {
		it("should not throw if all badges exist", async () => {
			mockDb.select.mockReturnThis();
			mockDb.from.mockReturnThis();
			mockDb.where.mockResolvedValue([{ count: 2 }]);
			await expect(service.assertBadgesExist(["badgeId1", "badgeId2"])).resolves.not.toThrow();
		});

		it("should throw NotFoundException if some badges are missing", async () => {
			mockDb.where.mockResolvedValue([{ count: 1 }]);
			await expect(service.assertBadgesExist(["badgeId1", "badgeId2"])).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("getAllBadges", () => {
		it("should return all badges from the database", async () => {
			const mockBadges = [
				{ id: "1", name: "Badge 1" },
				{ id: "2", name: "Badge 2" },
			];
			mockDb.where.mockResolvedValue(mockBadges);
			const result = await service.getAllBadges();
			expect(mockDb.select).toHaveBeenCalledWith({
				id: expect.anything(),
				name: expect.anything(),
				description: expect.anything(),
			});
			expect(mockDb.from).toHaveBeenCalled();
			expect(result).toEqual(mockBadges);
		});
	});

	describe("formatBadge", () => {
		it("should format a badge correctly", () => {
			const id = "1";
			const name = "Test badge";
			const description = "This is a test badge";
			const badge: Badge = {
				id,
				name,
				description,
				status: "active",
				createdBy: "userId",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};
			const result = service.formatBadge(badge);
			expect(result).toEqual({
				id,
				name,
				description,
			});
		});
	});
});
