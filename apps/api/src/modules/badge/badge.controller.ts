import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BadgeResponseSchema, badgeResponseSchema } from "@repo/schemas";
import { ZodOk } from "@/pipes/zod-validation/zod-validation.pipe";
import { UserStatusGuard } from "../auth/guards/user.status.guard";
import { BadgeService } from "./badge.service";

@ApiTags("Badge")
@Controller("badges")
@UseGuards(UserStatusGuard)
export class BadgeController {
	constructor(private readonly badgeService: BadgeService) {}

	// GET /badges
	@Get()
	@ZodOk(badgeResponseSchema)
	async createEvent(): Promise<BadgeResponseSchema[]> {
		return this.badgeService.getAllBadges();
	}
}
