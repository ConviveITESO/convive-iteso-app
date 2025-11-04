/** biome-ignore-all lint/style/useNamingConvention: <External object to the API being received and handled> */
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserResponseSchema } from "@repo/schemas";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { randomBytes, sha256 } from "../../utils/crypto";
import { base64UrlEncode } from "../../utils/encoding";
import { ConfigSchema } from "../config";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { User, users } from "../database/schemas";
import { S3Service } from "../s3/s3.service";

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
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly configService: ConfigService<ConfigSchema>,
		private readonly s3Service: S3Service,
	) {
		this.clientId = this.configService.getOrThrow("CLIENT_ID");
		this.clientSecret = this.configService.getOrThrow("CLIENT_SECRET");
		this.redirectUri = this.configService.getOrThrow("REDIRECT_URI");
	}

	private readonly clientId: string;
	private readonly clientSecret: string;
	private readonly redirectUri: string;

	private stateCode = base64UrlEncode(randomBytes(16));
	private nonce = base64UrlEncode(randomBytes(16));
	private codeVerifier = base64UrlEncode(randomBytes(32));
	private codeChallenge = base64UrlEncode(sha256(this.codeVerifier));

	private readonly jwks = createRemoteJWKSet(
		new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"),
	);

	getAuthUrl(): string {
		return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${
			this.clientId
		}&response_type=code&redirect_uri=${encodeURIComponent(
			this.redirectUri,
		)}&response_mode=query&scope=${encodeURIComponent(
			"openid profile email offline_access User.Read",
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
			profile: user.profile,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
			deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
		};
	}

	private async fetchProfilePhoto(accessToken: string) {
		const url = "https://graph.microsoft.com/v1.0/me/photo/$value";
		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (res.ok) {
			const arrayBuffer = await res.arrayBuffer();
			const contentType = res.headers.get("content-type") ?? "image/jpeg";
			return {
				buffer: Buffer.from(arrayBuffer),
				contentType,
			};
		}

		//404, no tiene foto
		return null;
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
			let imageUrl: string | null = null;
			const profilePhoto = await this.fetchProfilePhoto(tokens.access_token);

			if (profilePhoto) {
				const s3Key = `profile/${Date.now()}-${idTokenDecoded.email}`;
				await this.s3Service.uploadFile(s3Key, profilePhoto.buffer, profilePhoto.contentType);
				imageUrl = await this.s3Service.getFileUrl(s3Key);
			}

			const newUser = await this.db
				.insert(users)
				.values({
					email: idTokenDecoded.email,
					name: idTokenDecoded.name,
					profile: imageUrl,
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

	async validateIdToken(token: string): Promise<boolean> {
		try {
			const { payload } = await jwtVerify(token, this.jwks, {
				audience: this.clientId,
			});

			const email = payload["email" as const] as string | undefined;

			if (!email || !email.endsWith("@iteso.mx")) return false;
			return true;
		} catch {
			return false;
		}
	}
}
