/** biome-ignore-all lint/style/useNamingConvention: <External object to the API being received and handled> */
import crypto from "node:crypto";
import fetch from "node-fetch";
import process from "node:process";
import jwt, { JwtPayload } from "jsonwebtoken";

import { eq } from "drizzle-orm";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";

import { UserResponseSchema } from "@repo/schemas";

import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { users } from "../database/schemas";

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

	private stateCode = this.base64UrlEncode(crypto.randomBytes(16));
	private nonce = this.base64UrlEncode(crypto.randomBytes(16));
	private codeVerifier = this.base64UrlEncode(crypto.randomBytes(32));
	private codeChallenge = this.base64UrlEncode(this.sha256(this.codeVerifier));

	private base64UrlEncode(str: Buffer): string {
		return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	}

	private sha256(buffer: string): Buffer {
		return crypto.createHash("sha256").update(buffer).digest();
	}

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
			user = (await this.db
				.update(users)
				.set({ updatedAt: new Date() })
				.where(eq(users.id, existingUser.id))
				.returning()
				.then((res) => res[0])) as UserResponseSchema;
		} else {
			user = (await this.db
				.insert(users)
				.values({
					email: idTokenDecoded.email,
					name: idTokenDecoded.name,
				})
				.returning()
				.then((res) => res[0])) as UserResponseSchema;
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
