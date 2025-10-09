import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigSchema } from "@/modules/config";

@Injectable()
export class AdminGuard implements CanActivate {
	constructor(private readonly configService: ConfigService<ConfigSchema>) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest();
		const token = req.headers["admin-token"];

		if (!token) throw new ForbiddenException("Missing admin token");
		if (token !== this.configService.getOrThrow("ADMIN_TOKEN"))
			throw new ForbiddenException("Invalid admin token");

		return true;
	}
}
