import process from "node:process";
import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { CreateUserSchema } from "@repo/schemas";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { JwtPayload } from "jsonwebtoken";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import { users } from "@/modules/database/schemas/users";

interface AuthRequest extends Request {
	user?: CreateUserSchema;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async use(req: AuthRequest, res: Response, next: () => void) {
		const idToken = req.cookies.idToken;
		if (!idToken) {
			return res.status(401).json({ message: "Missing or invalid token", redirectTo: "/" });
		}

		try {
			const jwks = createRemoteJWKSet(
				new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"),
			);

			const { payload } = (await jwtVerify(idToken, jwks, {
				audience: process.env.CLIENT_ID ?? "",
			})) as JwtPayload;

			if (!payload.email) {
				res.status(403).json({ message: "No email received in the token", redirectTo: "/" });
			}

			const user = await this.db.query.users.findFirst({
				where: eq(users.email, payload.email),
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
