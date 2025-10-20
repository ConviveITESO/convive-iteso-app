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
});
