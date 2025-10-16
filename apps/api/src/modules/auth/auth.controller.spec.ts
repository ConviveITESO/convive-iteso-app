import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

jest.mock("jose", () => ({
	// biome-ignore lint/style/useNamingConvention: external library name
	createRemoteJWKSet: jest.fn(),
	jwtVerify: jest.fn(),
}));

describe("AuthController", () => {
	let controller: AuthController;

	const mockAuthService = {
		getAuthUrl: jest.fn(),
		handleCallback: jest.fn(),
		refreshIdToken: jest.fn(),
		validateIdToken: jest.fn(),
	};

	const mockResponse = (): Response => {
		const res: Partial<Response> = {};
		res.redirect = jest.fn().mockReturnValue(res);
		res.cookie = jest.fn().mockReturnValue(res);
		res.status = jest.fn().mockReturnValue(res);
		res.json = jest.fn().mockReturnValue(res);
		return res as Response;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: mockAuthService }],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("login", () => {
		it("should redirect to auth url", async () => {
			const res = mockResponse();
			mockAuthService.getAuthUrl.mockReturnValue("http://auth-url");

			await controller.login(res);

			expect(mockAuthService.getAuthUrl).toHaveBeenCalled();
			expect(res.redirect).toHaveBeenCalledWith("http://auth-url");
		});
	});

	describe("oauthCallback", () => {
		it("should set cookies and redirect", async () => {
			const res = mockResponse();
			mockAuthService.handleCallback.mockResolvedValue({
				idToken: "id-token",
				refreshToken: "refresh-token",
			});

			await controller.oatuhCallback("code123", "state123", res);

			expect(mockAuthService.handleCallback).toHaveBeenCalledWith("code123", "state123");
			expect(res.cookie).toHaveBeenCalledWith("idToken", "id-token", {
				httpOnly: true,
				secure: true,
			});
			expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", {
				httpOnly: true,
				secure: true,
			});
			expect(res.redirect).toHaveBeenCalledWith("http://localhost:3000/users");
		});
	});

	describe("refresh", () => {
		it("should return 401 if no refresh token", async () => {
			const res = mockResponse();
			const req = { cookies: {} } as Request;

			await controller.refresh(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: "No refresh token" });
		});

		it("should refresh tokens and set cookies", async () => {
			const res = mockResponse();
			const req = {
				cookies: { refreshToken: "refresh-token" },
			} as unknown as Request;

			mockAuthService.refreshIdToken.mockResolvedValue({
				idToken: "new-id-token",
				refreshToken: "new-refresh-token",
			});

			await controller.refresh(req, res);

			expect(mockAuthService.refreshIdToken).toHaveBeenCalledWith("refresh-token");
			expect(res.cookie).toHaveBeenCalledWith("idToken", "new-id-token", {
				httpOnly: true,
				secure: true,
			});
			expect(res.cookie).toHaveBeenCalledWith("refreshToken", "new-refresh-token", {
				httpOnly: true,
				secure: true,
			});
			expect(res.json).toHaveBeenCalledWith({ message: "Token refreshed" });
		});
	});

	describe("validate", () => {
		it("should return 401 if no ID token", async () => {
			const res = mockResponse();
			const req = { cookies: {} } as Request;

			await controller.validate(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: "No ID token" });
			expect(mockAuthService.validateIdToken).not.toHaveBeenCalled();
		});

		it("should return 401 if token is invalid", async () => {
			const res = mockResponse();
			const req = { cookies: { idToken: "invalid" } } as unknown as Request;

			mockAuthService.validateIdToken.mockResolvedValue(false);

			await controller.validate(req, res);

			expect(mockAuthService.validateIdToken).toHaveBeenCalledWith("invalid");
			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: "Invalid ID token" });
		});

		it("should return success if token is valid", async () => {
			const res = mockResponse();
			const req = { cookies: { idToken: "valid" } } as unknown as Request;

			mockAuthService.validateIdToken.mockResolvedValue(true);

			const result = await controller.validate(req, res);

			expect(mockAuthService.validateIdToken).toHaveBeenCalledWith("valid");
			expect(res.json).toHaveBeenCalledWith({ message: "ID token is valid" });
			expect(result).toEqual({ valid: true });
		});
	});
});
