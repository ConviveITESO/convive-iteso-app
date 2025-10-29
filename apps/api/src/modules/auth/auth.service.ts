/** biome-ignore-all lint/style/useNamingConvention: <External object to the API being received and handled> */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ConfigSchema } from "../config";

interface TokenResponse {
	access_token: string;
	id_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
	scope: string;
}

interface RefreshTokenResult {
	idToken: string;
	refreshToken?: string;
	expiresIn: number;
}

@Injectable()
export class AuthService {
	constructor(private readonly configService: ConfigService<ConfigSchema>) {
		this.clientId = this.configService.getOrThrow("CLIENT_ID");
		this.clientSecret = this.configService.getOrThrow("CLIENT_SECRET");
		this.redirectUri = this.configService.getOrThrow("REDIRECT_URI");
	}

	private readonly clientId: string;
	private readonly clientSecret: string;
	private readonly redirectUri: string;

	async refreshIdToken(refreshToken: string): Promise<RefreshTokenResult> {
		const tokenResponse = await fetch(
			"https://login.microsoftonline.com/common/oauth2/v2.0/token",
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

		if (!tokens.id_token) {
			throw new ForbiddenException("No id_token returned");
		}

		return {
			idToken: tokens.id_token,
			refreshToken: tokens.refresh_token,
			expiresIn: tokens.expires_in,
		};
	}

	async validateIdToken(token: string): Promise<boolean> {
		try {
			// Just decode without verification since we verified during login
			// The token stored is actually an access_token, not an id_token
			const decoded = jwt.decode(token) as JwtPayload;

			if (!decoded) {
				return false;
			}

			// Check expiration
			if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
				return false;
			}

			// Azure uses 'upn' (User Principal Name) for email, fallback to 'email'
			const email = (decoded.upn || decoded.email) as string | undefined;

			if (!email || !email.endsWith("@iteso.mx")) return false;
			return true;
		} catch {
			return false;
		}
	}
}
