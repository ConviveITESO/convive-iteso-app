import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
	let controller: HealthController;

	const mockHealthService = {
		getHealthStatus: jest.fn(),
		checkDatabaseHealth: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{
					provide: HealthService,
					useValue: mockHealthService,
				},
			],
		}).compile();

		controller = module.get<HealthController>(HealthController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getHealth", () => {
		it("should return health status from service", () => {
			const mockHealthStatus = {
				status: "ok",
				service: "ConviveITESO API",
				timestamp: "2024-01-15T10:30:00.000Z",
				uptime: 123.45,
				version: "1.0.0",
				environment: "development",
			};

			mockHealthService.getHealthStatus.mockReturnValue(mockHealthStatus);

			const result = controller.getHealth();

			expect(result).toEqual(mockHealthStatus);
			expect(mockHealthService.getHealthStatus).toHaveBeenCalledTimes(1);
		});

		it("should call healthService.getHealthStatus", () => {
			mockHealthService.getHealthStatus.mockReturnValue({
				status: "ok",
				service: "ConviveITESO API",
				timestamp: "2024-01-15T10:30:00.000Z",
				uptime: 100,
				version: "2.0.0",
				environment: "production",
			});

			controller.getHealth();

			expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
		});
	});

	describe("getDatabaseHealth", () => {
		it("should return ok status when database is healthy", async () => {
			const mockDbHealth = {
				status: "connected",
				type: "postgresql",
				timestamp: "2024-01-15T10:30:00.000Z",
			};

			mockHealthService.checkDatabaseHealth.mockResolvedValue(mockDbHealth);

			const result = await controller.getDatabaseHealth();

			expect(result).toHaveProperty("status", "ok");
			expect(result).toHaveProperty("database", mockDbHealth);
			expect(result).toHaveProperty("timestamp");
			expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
			expect(mockHealthService.checkDatabaseHealth).toHaveBeenCalledTimes(1);
		});

		it("should return error status when database check fails with Error", async () => {
			const dbError = new Error("Database connection failed: Connection timeout");
			mockHealthService.checkDatabaseHealth.mockRejectedValue(dbError);

			const result = await controller.getDatabaseHealth();

			expect(result).toHaveProperty("status", "error");
			expect(result).toHaveProperty("database");
			expect(result.database).toHaveProperty("status", "down");
			expect(result.database).toHaveProperty(
				"error",
				"Database connection failed: Connection timeout",
			);
			expect(result).toHaveProperty("timestamp");
			expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it("should return error status when database check fails with unknown error", async () => {
			mockHealthService.checkDatabaseHealth.mockRejectedValue("Unknown error");

			const result = await controller.getDatabaseHealth();

			expect(result).toHaveProperty("status", "error");
			expect(result).toHaveProperty("database");
			expect(result.database).toHaveProperty("status", "down");
			expect(result.database).toHaveProperty("error", "Unknown error");
		});

		it("should handle non-Error objects gracefully", async () => {
			mockHealthService.checkDatabaseHealth.mockRejectedValue({
				code: "ECONNREFUSED",
			});

			const result = await controller.getDatabaseHealth();

			expect(result).toHaveProperty("status", "error");
			expect(result.database).toHaveProperty("error", "Unknown error");
		});

		it("should include timestamp in both success and error responses", async () => {
			// Test success case
			mockHealthService.checkDatabaseHealth.mockResolvedValue({
				status: "connected",
				type: "postgresql",
				timestamp: "2024-01-15T10:30:00.000Z",
			});

			const successResult = await controller.getDatabaseHealth();
			expect(successResult.timestamp).toBeDefined();

			// Test error case
			mockHealthService.checkDatabaseHealth.mockRejectedValue(new Error("Connection failed"));

			const errorResult = await controller.getDatabaseHealth();
			expect(errorResult.timestamp).toBeDefined();
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});
});
