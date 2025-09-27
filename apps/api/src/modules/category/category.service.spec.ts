import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { Category } from "../database/schemas";
import { CategoryService } from "./category.service";

describe("CategoryService", () => {
	let service: CategoryService;
	const mockDb = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CategoryService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();
		service = module.get<CategoryService>(CategoryService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("assertCategoriesExist", () => {
		it("should not throw if all categories exist", async () => {
			mockDb.select.mockReturnThis();
			mockDb.from.mockReturnThis();
			mockDb.where.mockResolvedValue([{ count: 2 }]);
			await expect(
				service.assertCategoriesExist(["categoryId1", "categoryId2"]),
			).resolves.not.toThrow();
		});

		it("should throw NotFoundException if some categories are missing", async () => {
			mockDb.where.mockResolvedValue([{ count: 1 }]);
			await expect(service.assertCategoriesExist(["categoryId1", "categoryId2"])).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("formatCategory", () => {
		it("should format a category correctly", () => {
			const id = "1";
			const name = "Test category";
			const badge: Category = {
				id,
				name,
				status: "active",
				createdBy: "userId",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};
			const result = service.formatCategory(badge);
			expect(result).toEqual({
				id,
				name,
			});
		});
	});
});
