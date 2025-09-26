import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
	let controller: HealthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				HealthService,
				{
					provide: DATABASE_CONNECTION,
					useValue: undefined,
				},
			],
		}).compile();

		controller = module.get<HealthController>(HealthController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
