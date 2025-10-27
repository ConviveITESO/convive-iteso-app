import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { EventAnalyticsService } from "./event-analytics.service";

describe("EventAnalyticsService", () => {
	let service: EventAnalyticsService;

	const mockDb = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		innerJoin: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		execute: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [EventAnalyticsService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<EventAnalyticsService>(EventAnalyticsService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
