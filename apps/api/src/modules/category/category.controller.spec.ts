import { Test, TestingModule } from "@nestjs/testing";
import { AuthGuard } from "../auth/guards/auth.guard";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";

describe("CategoryController", () => {
	let controller: CategoryController;
	let service: CategoryService;

	const mockCategoryService = {
		getAllCategories: jest.fn(),
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
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();
		controller = module.get<CategoryController>(CategoryController);
		service = module.get<CategoryService>(CategoryService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("should return all categories", async () => {
		const mockCategories = [
			{ id: "1", name: "Category 1" },
			{ id: "2", name: "Category 2" },
		];
		mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);
		const result = await controller.createEvent();
		expect(service.getAllCategories).toHaveBeenCalledTimes(1);
		expect(result).toEqual(mockCategories);
	});
});
