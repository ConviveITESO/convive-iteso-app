import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { CategoryService } from "./category.service";

describe("CategoryService", () => {
	let service: CategoryService;
	const mockDb = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		returning: jest.fn(),
		query: {
			categories: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
			},
		},
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
			mockDb.where.mockResolvedValueOnce([{ count: 2 }]);

			await expect(service.assertCategoriesExist(["cat1", "cat2"])).resolves.not.toThrow();

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it("should throw NotFoundException if categories missing", async () => {
			mockDb.where.mockResolvedValueOnce([{ count: 1 }]);

			await expect(service.assertCategoriesExist(["cat1", "cat2"])).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("getCategories", () => {
		it("should return all categories if no query is provided", async () => {
			const categories = [{ id: "1" }, { id: "2" }];
			mockDb.query.categories.findMany.mockResolvedValueOnce(categories);

			const result = await service.getAllCategories();
			expect(result).toEqual(categories);
			expect(mockDb.query.categories.findMany).toHaveBeenCalled();
		});

		it("should apply filters when query is provided", async () => {
			const filtered = [{ id: "3" }];
			mockDb.query.categories.findMany.mockResolvedValueOnce(filtered);

			const query = { name: "sports", status: "active" as const };
			const result = await service.getAllCategories(query);

			expect(result).toEqual(filtered);
			expect(mockDb.query.categories.findMany).toHaveBeenCalledWith({
				where: expect.anything(),
			});
		});
	});

	describe("getCategoryById", () => {
		it("should return a category by ID", async () => {
			const category = { id: "1", name: "Tech" };
			mockDb.query.categories.findFirst.mockResolvedValueOnce(category);

			const result = await service.getCategoryById("1");
			expect(result).toEqual(category);
			expect(mockDb.query.categories.findFirst).toHaveBeenCalledWith({
				where: expect.anything(),
			});
		});
	});

	describe("createCategory", () => {
		it("should insert and return a category", async () => {
			const newCategory = { id: "1", name: "New Category" };
			mockDb.returning.mockResolvedValueOnce([newCategory]);

			const result = await service.createCategory(
				{ name: "New Category", status: "active" },
				"userId123",
			);

			expect(result).toEqual(newCategory);
			expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.values).toHaveBeenCalledWith({
				name: "New Category",
				status: "active",
				createdBy: "userId123",
			});
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe("updateCategory", () => {
		it("should update a category and return it", async () => {
			const updated = { id: "1", name: "Updated" };
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.updateCategory("1", { name: "Updated" });

			expect(result).toEqual(updated);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith({ name: "Updated" });
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe("deleteCategory", () => {
		it("should soft delete and return the category if found", async () => {
			const category = {
				id: "1",
				name: "Old Category",
				status: "active" as const,
				createdBy: "user1",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
			jest.spyOn(service, "getCategoryById").mockResolvedValueOnce(category);
			mockDb.update.mockReturnThis();
			mockDb.set.mockReturnThis();
			mockDb.where.mockReturnThis();

			const result = await service.deleteCategory("1");
			expect(result).toEqual(category);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith({
				status: "deleted",
				deletedAt: expect.any(Date),
			});
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("should return undefined if category does not exist", async () => {
			jest.spyOn(service, "getCategoryById").mockResolvedValueOnce(undefined);

			const result = await service.deleteCategory("doesnotexist");
			expect(result).toBeUndefined();
			expect(mockDb.update).not.toHaveBeenCalled();
		});
	});

	describe("formatCategory", () => {
		it("should format a category correctly", () => {
			const category = {
				id: "1",
				name: "Tech",
				status: "active" as const,
				createdBy: "user1",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-02-01T00:00:00Z"),
				deletedAt: null,
			};

			const result = service.formatCategory(category);

			expect(result).toEqual({
				id: "1",
				name: "Tech",
				status: "active",
				createdBy: "user1",
				createdAt: category.createdAt.toISOString(),
				updatedAt: category.updatedAt.toISOString(),
				deletedAt: null,
			});
		});
	});
});
