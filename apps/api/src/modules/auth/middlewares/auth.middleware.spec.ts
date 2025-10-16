import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { Response } from "express";
import { DATABASE_CONNECTION } from "@/modules/database/connection";
import { AuthMiddleware, AuthRequest } from "./auth.middleware";

jest.mock("jose", () => ({
	// biome-ignore lint/style/useNamingConvention: external library name
	createRemoteJWKSet: jest.fn(),
	jwtVerify: jest.fn(),
}));

const { jwtVerify } = jest.requireMock("jose");

describe("AuthMiddleware", () => {
	let middleware: AuthMiddleware;

	const mockDb = {
		query: {
			users: {
				findFirst: jest.fn(),
			},
		},
	};

	const mockConfigService = {
		getOrThrow: jest.fn((key: string) => {
			const config: Record<string, string> = {
				// biome-ignore lint/style/useNamingConvention: environment variable name
				CLIENT_ID: "test-client-id",
				// biome-ignore lint/style/useNamingConvention: environment variable name
				ADMIN_TOKEN: "super-secret-admin",
			};
			return config[key];
		}),
	};

	const mockResponse = (): Response => {
		const res: Partial<Response> = {};
		res.status = jest.fn().mockReturnValue(res);
		res.json = jest.fn().mockReturnValue(res);
		return res as Response;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthMiddleware,
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
				{ provide: ConfigService, useValue: mockConfigService },
			],
		}).compile();

		middleware = module.get<AuthMiddleware>(AuthMiddleware);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(middleware).toBeDefined();
	});

	it("should return 401 if no token provided", async () => {
		const req: AuthRequest = {
			cookies: {},
			headers: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		await middleware.use(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: "Missing or invalid token",
			redirectTo: "/",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 if jwtVerify throws", async () => {
		const req: AuthRequest = {
			cookies: { idToken: "bad-token" },
			headers: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		(jwtVerify as jest.Mock).mockRejectedValueOnce(new Error("invalid"));

		await middleware.use(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: "Invalid token",
			redirectTo: "/",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 403 if payload has no email", async () => {
		const req: AuthRequest = {
			cookies: { idToken: "token" },
			headers: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		(jwtVerify as jest.Mock).mockResolvedValueOnce({ payload: {} });

		await middleware.use(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({
			message: "No email received in the token",
			redirectTo: "/",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 if user not found in db", async () => {
		const req: AuthRequest = {
			cookies: { idToken: "token" },
			headers: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		(jwtVerify as jest.Mock).mockResolvedValueOnce({ payload: { email: "test@iteso.mx" } });
		mockDb.query.users.findFirst.mockResolvedValueOnce(undefined);

		await middleware.use(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: "User not found",
			redirectTo: "/",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should attach user to request and call next if valid", async () => {
		const req: AuthRequest = {
			cookies: { idToken: "token" },
			headers: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		const mockUser = {
			id: "1",
			name: "Alice",
			email: "alice@iteso.mx",
			role: "student",
			status: "active" as const,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		};

		(jwtVerify as jest.Mock).mockResolvedValueOnce({ payload: { email: "alice@iteso.mx" } });
		mockDb.query.users.findFirst.mockResolvedValueOnce(mockUser);

		await middleware.use(req, res, next);

		expect(req.user).toEqual(mockUser);
		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	it("should authenticate admin using admin-token header", async () => {
		const req: AuthRequest = {
			headers: { "admin-token": "super-secret-admin" },
			cookies: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		const mockAdminUser = {
			id: "99",
			email: "admin@iteso.mx",
			role: "admin",
			status: "active" as const,
			name: "Admin",
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		};

		mockDb.query.users.findFirst.mockResolvedValueOnce(mockAdminUser);

		await middleware.use(req, res, next);

		expect(mockDb.query.users.findFirst).toHaveBeenCalled();
		expect(req.user).toEqual(mockAdminUser);
		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	it("should fail admin auth if token does not match", async () => {
		const req: AuthRequest = {
			headers: { "admin-token": "wrong-token" },
			cookies: {},
		} as unknown as AuthRequest;
		const res = mockResponse();
		const next = jest.fn();

		await middleware.use(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: "Missing or invalid token",
			redirectTo: "/",
		});
		expect(next).not.toHaveBeenCalled();
	});
});
