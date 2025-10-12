import { Test, TestingModule } from "@nestjs/testing";
import { EventReminderService } from "./event-reminder.service";

describe("EventReminderService", () => {
	let service: EventReminderService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [EventReminderService],
		}).compile();

		service = module.get<EventReminderService>(EventReminderService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
