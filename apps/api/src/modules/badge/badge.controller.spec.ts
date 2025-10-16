import { Test, TestingModule } from "@nestjs/testing";
import { AuthGuard } from "../auth/guards/auth.guard";
import { BadgeController } from "./badge.controller";
import { BadgeService } from "./badge.service";

describe("BadgeController", () => {
	let controller: BadgeController;
	let service: BadgeService;

	const mockBadgeService = {
		getAllBadges: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [BadgeController],
			providers: [
				{
					provide: BadgeService,
					useValue: mockBadgeService,
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();
		controller = module.get<BadgeController>(BadgeController);
		service = module.get<BadgeService>(BadgeService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("should return all badges", async () => {
		const mockBadges = [
			{ id: "1", name: "Badge 1" },
			{ id: "2", name: "Badge 2" },
		];
		mockBadgeService.getAllBadges.mockResolvedValue(mockBadges);
		const result = await controller.createEvent();
		expect(service.getAllBadges).toHaveBeenCalledTimes(1);
		expect(result).toEqual(mockBadges);
	});
});
