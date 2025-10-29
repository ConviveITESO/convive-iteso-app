/** biome-ignore-all lint/style/useNamingConvention: <External object to the API being received and handled> */
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserResponseSchema } from "@repo/schemas";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import { AzureAuthResult, AzureProfile } from "@/types/auth.interface";
import { ConfigSchema } from "../../config";
import { AppDatabase, DATABASE_CONNECTION } from "../../database/connection";
import { User, users } from "../../database/schemas";

@Injectable()
export class AzureStrategy extends PassportStrategy(OAuth2Strategy, "azure") {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		configService: ConfigService<ConfigSchema>,
	) {
		super({
			authorizationURL: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
			tokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
			clientID: configService.getOrThrow("CLIENT_ID"),
			clientSecret: configService.getOrThrow("CLIENT_SECRET"),
			callbackURL: configService.getOrThrow("REDIRECT_URI"),
			scope: ["openid", "profile", "email", "offline_access"],
			state: false,
		});
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		_profile: AzureProfile,
	): Promise<AzureAuthResult> {
		const idTokenDecoded = jwt.decode(accessToken) as JwtPayload;

		if (!idTokenDecoded) {
			throw new ForbiddenException("Invalid id_token");
		}

		const email = (idTokenDecoded.upn || idTokenDecoded.email) as string;
		if (!email || !email.endsWith("@iteso.mx")) {
			throw new ForbiddenException("Email domain not allowed");
		}

		const existingUser = await this.db.query.users.findFirst({
			where: eq(users.email, email),
		});

		let user: User;
		if (existingUser) {
			const updatedUser = await this.db
				.update(users)
				.set({ updatedAt: new Date() })
				.where(eq(users.id, existingUser.id))
				.returning()
				.then((res) => res[0]);
			if (!updatedUser) throw new Error("Failed to update user");
			user = updatedUser;
		} else {
			const newUser = await this.db
				.insert(users)
				.values({
					email: email,
					name: idTokenDecoded.name,
				})
				.returning()
				.then((res) => res[0]);
			if (!newUser) throw new Error("Failed to create user");
			user = newUser;
		}

		return {
			user: this.formatUser(user),
			idToken: accessToken,
			refreshToken,
			expiresIn: idTokenDecoded.exp ? idTokenDecoded.exp - Math.floor(Date.now() / 1000) : 3600,
		};
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
}
