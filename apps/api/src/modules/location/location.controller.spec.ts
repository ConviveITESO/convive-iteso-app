import { Test, TestingModule } from "@nestjs/testing";
import { UserStatusGuard } from "../auth/guards/user.status.guard";
import { LocationController } from "./location.controller";
import { LocationService } from "./location.service";

describe("LocationController", () => {
	let controller: LocationController;
	let service: LocationService;

	const mockLocationService = {
		getAllLocations: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [LocationController],
			providers: [
				{
					provide: LocationService,
					useValue: mockLocationService,
				},
			],
		})
			.overrideGuard(UserStatusGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();
		controller = module.get<LocationController>(LocationController);
		service = module.get<LocationService>(LocationService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("should return all locations", async () => {
		const mockLocations = [
			{ id: "1", name: "Location 1" },
			{ id: "2", name: "Location 2" },
		];
		mockLocationService.getAllLocations.mockResolvedValue(mockLocations);
		const result = await controller.createEvent();
		expect(service.getAllLocations).toHaveBeenCalledTimes(1);
		expect(result).toEqual(mockLocations);
	});
});
