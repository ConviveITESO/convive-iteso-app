/** biome-ignore-all lint/style/useNamingConvention: <External object to the API being emulated> */

import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import jwt, { JwtPayload } from "jsonwebtoken";
import { DATABASE_CONNECTION } from "../database/connection";
import { AuthService } from "./auth.service";

declare const global: { fetch: typeof fetch };

describe("AuthService", () => {
	let service: AuthService;

	const mockDb = {
		query: {
			users: {
				findFirst: jest.fn(),
			},
		},
		insert: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		returning: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<AuthService>(AuthService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getAuthUrl", () => {
		it("should return a valid Microsoft login URL", () => {
			const url = service.getAuthUrl();
			expect(url).toContain("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
			expect(url).toContain("client_id=");
			expect(url).toContain("redirect_uri=");
			expect(url).toContain("scope=");
			expect(url).toContain("code_challenge_method=S256");
		});
	});

	describe("handleCallback", () => {
		const validTokens = {
			id_token: "id-token",
			refresh_token: "refresh-token",
			expires_in: 3600,
			access_token: "access",
			token_type: "Bearer",
			scope: "openid",
		};

		let validJwt: JwtPayload;
		let stateCode: string;

		beforeEach(() => {
			// service is already instantiated here, so read its generated state/nonce
			stateCode = (service as unknown as { stateCode: string }).stateCode;
			validJwt = {
				nonce: (service as unknown as { nonce: string }).nonce,
				email: "test@iteso.mx",
				name: "Test User",
			};

			global.fetch = jest.fn().mockResolvedValue({
				json: jest.fn().mockResolvedValue(validTokens),
			}) as unknown as typeof fetch;

			jest.spyOn(jwt, "decode").mockReturnValue(validJwt);
		});

		it("should throw if state does not match", async () => {
			await expect(service.handleCallback("code", "wrong-state")).rejects.toThrow(
				ForbiddenException,
			);
		});

		it("should throw if no id_token returned", async () => {
			// return empty tokens once
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				json: jest.fn().mockResolvedValue({}),
			});

			await expect(service.handleCallback("code", stateCode)).rejects.toThrow(
				"No id_token returned",
			);
		});

		it("should throw if jwt.decode returns null", async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				json: jest.fn().mockResolvedValue(validTokens),
			});
			jest.spyOn(jwt, "decode").mockReturnValueOnce(null);

			await expect(service.handleCallback("code", stateCode)).rejects.toThrow("Invalid id_token");
		});

		it("should throw if nonce does not match", async () => {
			jest.spyOn(jwt, "decode").mockReturnValueOnce({
				...validJwt,
				nonce: "wrong",
			});

			await expect(service.handleCallback("code", stateCode)).rejects.toThrow("Invalid nonce");
		});

		it("should throw if email is not allowed domain", async () => {
			jest.spyOn(jwt, "decode").mockReturnValueOnce({
				...validJwt,
				email: "test@gmail.com",
			});

			await expect(service.handleCallback("code", stateCode)).rejects.toThrow(
				"Email domain not allowed",
			);
		});

		it("should update existing user", async () => {
			mockDb.query.users.findFirst.mockResolvedValueOnce({
				id: "123",
				email: validJwt.email,
			});

			mockDb.returning.mockResolvedValueOnce([
				{ id: "123", email: validJwt.email, name: "Updated" },
			]);

			const result = await service.handleCallback("code", stateCode);

			expect(result).toMatchObject({
				idToken: validTokens.id_token,
				refreshToken: validTokens.refresh_token,
				expiresIn: validTokens.expires_in,
				user: { id: "123", email: validJwt.email, name: "Updated" },
			});
		});

		it("should insert new user if not exists", async () => {
			mockDb.query.users.findFirst.mockResolvedValueOnce(null);

			mockDb.returning.mockResolvedValueOnce([
				{ id: "456", email: validJwt.email, name: validJwt.name },
			]);

			const result = await service.handleCallback("code", stateCode);

			expect(result).toMatchObject({
				idToken: validTokens.id_token,
				refreshToken: validTokens.refresh_token,
				expiresIn: validTokens.expires_in,
				user: { id: "456", email: validJwt.email, name: validJwt.name },
			});
		});
	});

	describe("refreshIdToken", () => {
		const validTokens = {
			id_token: "new-id-token",
			refresh_token: "new-refresh-token",
			expires_in: 3600,
			access_token: "access",
			token_type: "Bearer",
			scope: "openid",
		};

		beforeEach(() => {
			global.fetch = jest.fn().mockResolvedValue({
				json: jest.fn().mockResolvedValue(validTokens),
			}) as unknown as typeof fetch;
		});

		it("should throw if no id_token returned", async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				json: jest.fn().mockResolvedValue({}),
			});

			await expect(service.refreshIdToken("refresh")).rejects.toThrow("No id_token returned");
		});

		it("should return refreshed tokens", async () => {
			const result = await service.refreshIdToken("refresh");
			expect(result).toEqual({
				idToken: "new-id-token",
				refreshToken: "new-refresh-token",
				expiresIn: 3600,
			});
		});
	});
});
