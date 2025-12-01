import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { EventAnalyticsController } from "./event-analytics.controller";
import { EventAnalyticsService } from "./event-analytics.service";

describe("EventAnalyticsController", () => {
	let controller: EventAnalyticsController;

	const mockEventAnalyticsService = {
		getParticipants: jest.fn(),
		getChart: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EventAnalyticsController],
			providers: [{ provide: EventAnalyticsService, useValue: mockEventAnalyticsService }],
		}).compile();

		controller = module.get<EventAnalyticsController>(EventAnalyticsController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getParticipants", () => {
		it("returns participants from service", async () => {
			const mockResult = [
				{ userId: "u1", userName: "User One", subscriptionStatus: "registered", eventQuota: 10 },
			];
			mockEventAnalyticsService.getParticipants.mockResolvedValueOnce(mockResult);
			const result = await controller.getParticipants({ id: "event-1" });
			expect(mockEventAnalyticsService.getParticipants).toHaveBeenCalledWith("event-1");
			expect(result).toEqual(mockResult);
		});

		it("propagates NotFoundException", async () => {
			mockEventAnalyticsService.getParticipants.mockRejectedValueOnce(
				new NotFoundException("Event not found"),
			);
			await expect(controller.getParticipants({ id: "missing" })).rejects.toThrow(
				NotFoundException,
			);
		});

		it("returns empty array when service returns no participants", async () => {
			mockEventAnalyticsService.getParticipants.mockResolvedValueOnce([]);
			const result = await controller.getParticipants({ id: "event-2" });
			expect(result).toEqual([]);
		});

		it("propagates generic errors from service", async () => {
			mockEventAnalyticsService.getParticipants.mockRejectedValueOnce(new Error("boom"));
			await expect(controller.getParticipants({ id: "event-3" })).rejects.toThrow("boom");
		});
	});

	describe("getChart", () => {
		it("returns chart slices from service", async () => {
			const chart = [
				{ name: "registered", count: 5 },
				{ name: "cancelled", count: 1 },
				{ name: "waitlisted", count: 2 },
				{ name: "attended", count: 1 },
				{ name: "quota", count: 1 },
			];
			mockEventAnalyticsService.getChart.mockResolvedValueOnce(chart);
			const result = await controller.getChart({ id: "event-1" });
			expect(mockEventAnalyticsService.getChart).toHaveBeenCalledWith("event-1");
			expect(result).toEqual(chart);
		});

		it("propagates NotFoundException", async () => {
			mockEventAnalyticsService.getChart.mockRejectedValueOnce(
				new NotFoundException("Event not found"),
			);
			await expect(controller.getChart({ id: "missing" })).rejects.toThrow(NotFoundException);
		});

		it("propagates generic errors from service", async () => {
			mockEventAnalyticsService.getChart.mockRejectedValueOnce(new Error("unexpected"));
			await expect(controller.getChart({ id: "event-err" })).rejects.toThrow("unexpected");
		});
	});
});
