import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ConfigSchema } from "../../config";
import { AppDatabase, DATABASE_CONNECTION } from "../../database/connection";
import { User, users } from "../../database/schemas";

interface AuthRequest extends Request {
	user?: User;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly configService: ConfigService<ConfigSchema>,
	) {}

	async use(req: AuthRequest, res: Response, next: () => void) {
		const adminToken = req.headers["admin-token"];
		if (adminToken && adminToken === this.configService.getOrThrow("ADMIN_TOKEN")) {
			const adminEmail = "admin@iteso.mx";
			const user = await this.db.query.users.findFirst({
				where: eq(users.email, adminEmail),
			});
			req.user = user;
			return next();
		}

		Logger.log("AuthMiddleware called");
		const idToken = req.cookies?.idToken;
		if (!idToken) {
			return res.status(401).json({ message: "Missing or invalid token", redirectTo: "/" });
		}

		try {
			const payload = jwt.decode(idToken) as JwtPayload;

			if (!payload) {
				return res.status(401).json({ message: "Invalid token", redirectTo: "/" });
			}

			if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
				return res.status(401).json({ message: "Token expired", redirectTo: "/" });
			}

			const email = (payload.upn || payload.email) as string | undefined;
			if (!email) {
				return res.status(403).json({ message: "No email received in the token", redirectTo: "/" });
			}

			Logger.log(`Email: ${email}`);

			const user = await this.db.query.users.findFirst({
				where: eq(users.email, email),
			});

			if (!user) {
				return res.status(401).json({ message: "User not found", redirectTo: "/" });
			}

			req.user = user;
			next();
		} catch {
			return res.status(401).json({ message: "Invalid token", redirectTo: "/" });
		}
	}
}
