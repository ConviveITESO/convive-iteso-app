import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
	CategoryIdParamSchema,
	CategoryQuerySchema,
	CreateCategorySchema,
	UpdateCategorySchema,
} from "@repo/schemas";
import { UserRequest } from "@/types/user.request";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";

describe("CategoryController", () => {
	let controller: CategoryController;
	let service: CategoryService;

	const mockCategoryService = {
		getAllCategories: jest.fn(),
		getCategoryById: jest.fn(),
		createCategory: jest.fn(),
		updateCategory: jest.fn(),
		deleteCategory: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CategoryController],
			providers: [
				{
					provide: CategoryService,
					useValue: mockCategoryService,
				},
			],
		}).compile();

		controller = module.get<CategoryController>(CategoryController);
		service = module.get<CategoryService>(CategoryService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getAllCategories", () => {
		it("should return all categories without query", async () => {
			const mockCategories = [{ id: "1", name: "Sports" }];
			mockCategoryService.getAllCategories.mockResolvedValueOnce(mockCategories);

			const result = await controller.getAllCategories(undefined);

			expect(service.getAllCategories).toHaveBeenCalledWith(undefined);
			expect(result).toEqual(mockCategories);
		});

		it("should return filtered categories when query provided", async () => {
			const query: CategoryQuerySchema = { name: "Tech", status: "active" };
			const mockCategories = [{ id: "2", name: "Tech" }];
			mockCategoryService.getAllCategories.mockResolvedValueOnce(mockCategories);

			const result = await controller.getAllCategories(query);

			expect(service.getAllCategories).toHaveBeenCalledWith(query);
			expect(result).toEqual(mockCategories);
		});
	});

	describe("getCategoryById", () => {
		it("should return a category by id", async () => {
			const id = "1";
			const mockCategory = { id, name: "Art" };
			mockCategoryService.getCategoryById.mockResolvedValueOnce(mockCategory);

			const result = await controller.getCategoryById(id);

			expect(service.getCategoryById).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockCategory);
		});
	});

	describe("createCategory", () => {
		it("should create a new category", async () => {
			const data: CreateCategorySchema = { name: "New", status: "active" };
			const userId = "user-123";
			const mockReq = { user: { id: userId } } as unknown as UserRequest;
			const mockCategory = { id: "1", ...data, createdBy: userId };

			mockCategoryService.createCategory.mockResolvedValueOnce(mockCategory);

			const result = await controller.createCategory(mockReq, data);

			expect(service.createCategory).toHaveBeenCalledWith(data, userId);
			expect(result).toEqual(mockCategory);
		});
	});

	describe("updateFullCategory", () => {
		it("should update a category fully", async () => {
			const id: CategoryIdParamSchema = "cat-1";
			const data: CreateCategorySchema = { name: "Updated", status: "active" };
			const mockCategory = { id, ...data };

			mockCategoryService.updateCategory.mockResolvedValueOnce(mockCategory);

			const result = await controller.updateFullCategory(data, id);

			expect(service.updateCategory).toHaveBeenCalledWith(id, data);
			expect(result).toEqual(mockCategory);
		});
	});

	describe("updateCategory", () => {
		it("should partially update a category and log debug info", async () => {
			const id: CategoryIdParamSchema = "cat-2";
			const data: UpdateCategorySchema = { name: "Partially Updated" };
			const mockCategory = { id, ...data };

			mockCategoryService.updateCategory.mockResolvedValueOnce(mockCategory);
			const loggerSpy = jest.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);

			const result = await controller.updateCategory(data, id);

			expect(loggerSpy).toHaveBeenCalledTimes(2);
			expect(service.updateCategory).toHaveBeenCalledWith(id, data);
			expect(result).toEqual(mockCategory);

			loggerSpy.mockRestore();
		});
	});

	describe("deleteCategory", () => {
		it("should delete a category", async () => {
			const id: CategoryIdParamSchema = "cat-3";
			const mockDeletedCategory = { id, name: "Old Category", status: "deleted" as const };

			mockCategoryService.deleteCategory.mockResolvedValueOnce(mockDeletedCategory);

			const result = await controller.deleteCategory(id);

			expect(service.deleteCategory).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockDeletedCategory);
		});
	});
});
