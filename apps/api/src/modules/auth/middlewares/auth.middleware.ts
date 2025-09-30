import process from "node:process";
import { Injectable, Inject, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { users } from "@/modules/database/schemas/users";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import * as jose from "jose";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import { CreateUserSchema } from "@repo/schemas";

interface AuthRequest extends Request {
	user?: CreateUserSchema;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async use(req: AuthRequest, res: Response, next: () => void) {
		console.log("aqui");
		const authHeader = req.headers.authorization;
		console.log(authHeader);
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "Missing or invalid token", redirectTo: "/login" });
		}

		const token = authHeader.split(" ")[1];

		try {
			const jwks = jose.createRemoteJWKSet(
				new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"),
			);

			const { payload } = (await jose.jwtVerify(token as string, jwks, {
				audience: process.env.CLIENT_ID ?? "",
			})) as JwtPayload;

			if (!payload.email) {
				res.status(403).json({ message: "No email received in the token", redirectTo: "/login" });
			}

			const user = await this.db.query.users.findFirst({
				where: eq(users.email, payload.email),
			});

			if (!user) {
				return res.status(401).json({ message: "User not found", redirectTo: "/login" });
			}

			req.user = user;
			next();
		} catch {
			return res.status(401).json({ message: "Invalid token", redirectTo: "/login" });
		}
	}
}
