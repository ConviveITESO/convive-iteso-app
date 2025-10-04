import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { HealthService } from "./health.service";

describe("HealthService", () => {
	let service: HealthService;

	const mockDatabase = {
		execute: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				HealthService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDatabase,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<HealthService>(HealthService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
