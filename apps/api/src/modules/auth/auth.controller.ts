import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AzureAuthResult } from "@/types/auth.interface";
import { User } from "../database/schemas";
import { AuthService } from "./auth.service";

interface AuthRequest extends Request {
	user?: User;
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	private redirectUri: string;

	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
	) {
		const frontendUrl = this.configService.getOrThrow("FRONTEND_URL");
		this.redirectUri = `${frontendUrl}/feed`;
	}

	// Initiates Azure OAuth2 flow
	// AuthGuard('azure') automatically redirects to Azure login
	@Get("login")
	@UseGuards(AuthGuard("azure"))
	async login() {
		// Guard automatically redirects to Azure login
	}

	// Azure OAuth2 callback endpoint
	// AuthGuard('azure') handles the OAuth callback and populates req.user
	@Get("oauth-callback")
	@UseGuards(AuthGuard("azure"))
	async oauthCallback(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
		const result = req.user as unknown as AzureAuthResult;

		// Set cookies with tokens
		res
			.cookie("idToken", result.idToken, { httpOnly: true, secure: true })
			.cookie("refreshToken", result.refreshToken, {
				httpOnly: true,
				secure: true,
			});

		// Redirect to frontend
		res.redirect(this.redirectUri);
	}

	@Post("refresh")
	async refresh(@Req() req: Request, @Res() res: Response) {
		const refreshToken = req.cookies?.refreshToken;

		if (!refreshToken) {
			res.status(401).json({ message: "No refresh token" });
			return;
		}

		const tokens = await this.authService.refreshIdToken(refreshToken);

		res
			.cookie("idToken", tokens.idToken, { httpOnly: true, secure: true })
			.cookie("refreshToken", tokens.refreshToken, {
				httpOnly: true,
				secure: true,
			})
			.json({ message: "Token refreshed" });
	}

	@Get("validate")
	async validate(@Req() req: Request, @Res() res: Response) {
		const idToken = req.cookies?.idToken;
		if (!idToken) {
			res.status(401).json({ message: "No ID token" });
			return;
		}

		const valid = await this.authService.validateIdToken(idToken);
		if (!valid) {
			res.status(401).json({ message: "Invalid ID token" });
			return;
		}

		res.json({ message: "ID token is valid" });
	}
}
