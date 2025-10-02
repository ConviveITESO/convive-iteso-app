/** biome-ignore-all lint/style/useNamingConvention: <External object to the API being received and handled> */
import process from "node:process";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { UserResponseSchema } from "@repo/schemas";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";
import { randomBytes, sha256 } from "../../utils/crypto";
import { base64UrlEncode } from "../../utils/encoding";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { User, users } from "../database/schemas";

interface TokenResponse {
	access_token: string;
	id_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
	scope: string;
}

@Injectable()
export class AuthService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	private clientId = process.env.CLIENT_ID ?? "";
	private clientSecret = process.env.CLIENT_SECRET ?? "";
	private redirectUri = process.env.REDIRECT_URI ?? "http://localhost:8080/auth/oauth-callback";

	private stateCode = base64UrlEncode(randomBytes(16));
	private nonce = base64UrlEncode(randomBytes(16));
	private codeVerifier = base64UrlEncode(randomBytes(32));
	private codeChallenge = base64UrlEncode(sha256(this.codeVerifier));

	getAuthUrl(): string {
		return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${
			this.clientId
		}&response_type=code&redirect_uri=${encodeURIComponent(
			this.redirectUri,
		)}&response_mode=query&scope=${encodeURIComponent(
			"openid profile email offline_access",
		)}&state=${this.stateCode}&nonce=${this.nonce}&code_challenge=${
			this.codeChallenge
		}&code_challenge_method=S256`;
	}

	private formatUser(user: User): UserResponseSchema {
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			status: user.status,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
			deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
		};
	}

	async handleCallback(code: string, state: string) {
		if (state !== this.stateCode) throw new ForbiddenException("Invalid state");

		const tokenResponse = await fetch(
			`https://login.microsoftonline.com/common/oauth2/v2.0/token`,
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					grant_type: "authorization_code",
					code,
					code_verifier: this.codeVerifier,
					redirect_uri: this.redirectUri,
				}),
			},
		);

		const tokens = (await tokenResponse.json()) as TokenResponse;

		if (!tokens.id_token) throw new ForbiddenException("No id_token returned");

		const idTokenDecoded = jwt.decode(tokens.id_token) as JwtPayload;
		if (!idTokenDecoded) throw new ForbiddenException("Invalid id_token");
		if (idTokenDecoded.nonce !== this.nonce) throw new ForbiddenException("Invalid nonce");
		if (!idTokenDecoded.email || !idTokenDecoded.email.endsWith("@iteso.mx"))
			throw new ForbiddenException("Email domain not allowed");

		const existingUser = await this.db.query.users.findFirst({
			where: eq(users.email, idTokenDecoded.email as string),
		});

		let user: UserResponseSchema;
		if (existingUser) {
			const updatedUser = await this.db
				.update(users)
				.set({ updatedAt: new Date() })
				.where(eq(users.id, existingUser.id))
				.returning()
				.then((res) => res[0]);
			if (!updatedUser) throw new Error("Failed to update user");
			user = this.formatUser(updatedUser);
		} else {
			const newUser = await this.db
				.insert(users)
				.values({
					email: idTokenDecoded.email,
					name: idTokenDecoded.name,
				})
				.returning()
				.then((res) => res[0]);
			if (!newUser) throw new Error("Failed to create user");
			user = this.formatUser(newUser);
		}

		return {
			idToken: tokens.id_token,
			refreshToken: tokens.refresh_token,
			expiresIn: tokens.expires_in,
			user,
		};
	}

	async refreshIdToken(refreshToken: string) {
		const tokenResponse = await fetch(
			`https://login.microsoftonline.com/common/oauth2/v2.0/token`,
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					grant_type: "refresh_token",
					refresh_token: refreshToken,
					redirect_uri: this.redirectUri,
				}),
			},
		);

		const tokens = (await tokenResponse.json()) as TokenResponse;

		if (!tokens.id_token) throw new ForbiddenException("No id_token returned");

		return {
			idToken: tokens.id_token,
			refreshToken: tokens.refresh_token,
			expiresIn: tokens.expires_in,
		};
	}
}
