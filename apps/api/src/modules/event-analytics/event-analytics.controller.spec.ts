import { Test, TestingModule } from "@nestjs/testing";
import { EventAnalyticsController } from "./event-analytics.controller";

describe("EventAnalyticsController", () => {
	let controller: EventAnalyticsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EventAnalyticsController],
		}).compile();

		controller = module.get<EventAnalyticsController>(EventAnalyticsController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
