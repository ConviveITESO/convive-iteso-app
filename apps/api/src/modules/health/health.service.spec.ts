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
		getOrThrow: jest.fn(),
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

	describe("getHealthStatus", () => {
		it("should return health status with correct structure", () => {
			mockConfigService.getOrThrow.mockReturnValueOnce("1.0.0"); // APP_VERSION
			mockConfigService.getOrThrow.mockReturnValueOnce("development"); // NODE_ENV

			const result = service.getHealthStatus();

			expect(result).toHaveProperty("status", "ok");
			expect(result).toHaveProperty("service", "ConviveITESO API");
			expect(result).toHaveProperty("timestamp");
			expect(result).toHaveProperty("uptime");
			expect(result).toHaveProperty("version", "1.0.0");
			expect(result).toHaveProperty("environment", "development");
		});

		it("should return valid ISO timestamp", () => {
			mockConfigService.getOrThrow.mockReturnValueOnce("1.0.0");
			mockConfigService.getOrThrow.mockReturnValueOnce("production");

			const result = service.getHealthStatus();

			expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it("should return numeric uptime", () => {
			mockConfigService.getOrThrow.mockReturnValueOnce("1.0.0");
			mockConfigService.getOrThrow.mockReturnValueOnce("test");

			const result = service.getHealthStatus();

			expect(typeof result.uptime).toBe("number");
			expect(result.uptime).toBeGreaterThanOrEqual(0);
		});

		it("should call configService.getOrThrow for version and environment", () => {
			mockConfigService.getOrThrow.mockReturnValueOnce("2.0.0");
			mockConfigService.getOrThrow.mockReturnValueOnce("staging");

			service.getHealthStatus();

			expect(mockConfigService.getOrThrow).toHaveBeenCalledWith("APP_VERSION");
			expect(mockConfigService.getOrThrow).toHaveBeenCalledWith("NODE_ENV");
			expect(mockConfigService.getOrThrow).toHaveBeenCalledTimes(2);
		});
	});

	describe("checkDatabaseHealth", () => {
		it("should return connected status when database query succeeds", async () => {
			mockDatabase.execute.mockResolvedValueOnce(undefined);

			const result = await service.checkDatabaseHealth();

			expect(result).toHaveProperty("status", "connected");
			expect(result).toHaveProperty("type", "postgresql");
			expect(result).toHaveProperty("timestamp");
			expect(mockDatabase.execute).toHaveBeenCalledWith("SELECT 1");
		});

		it("should return valid ISO timestamp on success", async () => {
			mockDatabase.execute.mockResolvedValueOnce(undefined);

			const result = await service.checkDatabaseHealth();

			expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it("should throw error when database query fails with Error instance", async () => {
			const dbError = new Error("Connection timeout");
			mockDatabase.execute.mockRejectedValueOnce(dbError);

			await expect(service.checkDatabaseHealth()).rejects.toThrow(
				"Database connection failed: Connection timeout",
			);
			expect(mockDatabase.execute).toHaveBeenCalledWith("SELECT 1");
		});

		it("should throw error when database query fails with unknown error", async () => {
			mockDatabase.execute.mockRejectedValueOnce("Unknown error");

			await expect(service.checkDatabaseHealth()).rejects.toThrow(
				"Database connection failed: Unknown error",
			);
		});

		it("should handle non-Error objects gracefully", async () => {
			mockDatabase.execute.mockRejectedValueOnce({ code: "ECONNREFUSED" });

			await expect(service.checkDatabaseHealth()).rejects.toThrow(
				"Database connection failed: Unknown error",
			);
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});
});
