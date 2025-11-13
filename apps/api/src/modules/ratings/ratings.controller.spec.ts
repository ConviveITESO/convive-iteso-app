import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { UserRequest } from "@/types/user.request";
import { RatingsController } from "./ratings.controller";
import { RatingsService } from "./ratings.service";

describe("RatingsController", () => {
	let controller: RatingsController;

	const mockRatingsService = {
		addRatingToEvent: jest.fn(),
		deleteRatingFromEvent: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [RatingsController],
			providers: [{ provide: RatingsService, useValue: mockRatingsService }],
		}).compile();

		controller = module.get<RatingsController>(RatingsController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("creates a rating for the provided event", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const created = { id: 1, score: 4 };
		mockRatingsService.addRatingToEvent.mockResolvedValue(created);

		const result = await controller.addRatingToEvent("event-1", req, { score: 4 });

		expect(result).toEqual(created);
		expect(mockRatingsService.addRatingToEvent).toHaveBeenCalledWith("event-1", "user-1", {
			score: 4,
		});
	});

	it("throws BadRequestException when the rating cannot be created", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		mockRatingsService.addRatingToEvent.mockResolvedValue(null);

		await expect(controller.addRatingToEvent("event-1", req, { score: 4 })).rejects.toThrow(
			BadRequestException,
		);
	});

	it("removes an existing rating", async () => {
		const req = { user: { id: "user-1", name: "Test" } } as UserRequest;
		const deleted = { id: 1 };
		mockRatingsService.deleteRatingFromEvent.mockResolvedValue(deleted);

		const result = await controller.removeRatingToEvent("event-1", req);

		expect(result).toEqual(deleted);
		expect(mockRatingsService.deleteRatingFromEvent).toHaveBeenCalledWith("user-1", "event-1");
	});

	it("throws NotFoundException when there is nothing to delete", async () => {
		const req = { user: { id: "user-1", name: "Test" } } as UserRequest;
		mockRatingsService.deleteRatingFromEvent.mockResolvedValue(null);

		await expect(controller.removeRatingToEvent("event-1", req)).rejects.toThrow(NotFoundException);
	});
});
