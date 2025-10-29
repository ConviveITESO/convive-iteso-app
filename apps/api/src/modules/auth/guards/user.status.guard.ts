import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { CreateUserSchema } from "@repo/schemas";
import { Request } from "express";

interface AuthRequest extends Request {
	user: CreateUserSchema;
}

@Injectable()
export class UserStatusGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		Logger.log("UserStatusGuard canActivate");
		const req = context.switchToHttp().getRequest<AuthRequest>();

		if (!req.user) {
			throw new UnauthorizedException("User not found");
		}

		if (req.user.status !== "active") {
			throw new UnauthorizedException("User is not active");
		}
		return true;
	}
}
