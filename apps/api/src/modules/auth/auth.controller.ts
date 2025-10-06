import { Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	//GET /login
	@Get("login")
	async login(@Res() res: Response) {
		const url = this.authService.getAuthUrl();
		res.redirect(url);
	}

	//GET /oauth-callback?code=...&state=...
	@Get("oauth-callback")
	async oatuhCallback(
		@Query("code") code: string,
		@Query("state") state: string,
		@Res() res: Response,
	): Promise<void> {
		const result = await this.authService.handleCallback(code, state);
		res
			.cookie("idToken", result.idToken, { httpOnly: true, secure: true })
			.cookie("refreshToken", result.refreshToken, { httpOnly: true, secure: true });

		// Redirect to Frontend
		res.redirect("http://localhost:3000/users");
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
			.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: true })
			.json({ message: "Token refreshed" });
	}
}
