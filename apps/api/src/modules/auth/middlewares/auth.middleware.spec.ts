import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "@/modules/database/connection";
import { AuthMiddleware } from "./auth.middleware";

describe("AuthMiddleware", () => {
	let middleware: AuthMiddleware;
	const mockDb = {
		findFirst: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthMiddleware, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();
		middleware = module.get<AuthMiddleware>(AuthMiddleware);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(middleware).toBeDefined();
	});
});
