import { Test, TestingModule } from "@nestjs/testing";
import { BadgeService } from "./badge.service";

describe("BadgesService", () => {
	let service: BadgeService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [BadgeService],
		}).compile();

		service = module.get<BadgeService>(BadgeService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
