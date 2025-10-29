import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	EventAnalyticsChartSimpleResponseSchema,
	EventAnalyticsParticipantsResponseSchema,
	EventIdParamSchema,
	eventAnalyticsChartSimpleResponseSchema,
	eventAnalyticsParticipantsResponseSchema,
	eventIdParamSchema,
} from "@repo/schemas";
import {
	ZodOk,
	/* ZodOk, */
	ZodParam,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserStatusGuard } from "../auth/guards/user.status.guard";
import { EventAnalyticsService } from "./event-analytics.service";

@ApiTags("Event Analytics")
@UseGuards(UserStatusGuard)
@Controller("event-analytics")
export class EventAnalyticsController {
	constructor(private readonly service: EventAnalyticsService) {}

	@Get(":id/participants")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(eventAnalyticsParticipantsResponseSchema)
	async getParticipants(
		@Param(new ZodValidationPipe(eventIdParamSchema)) idParam: EventIdParamSchema,
	): Promise<EventAnalyticsParticipantsResponseSchema> {
		return this.service.getParticipants(idParam.id);
	}

	// GET /event-analytics/:id/chart
	@Get(":id/chart")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(eventAnalyticsChartSimpleResponseSchema)
	async getChart(
		@Param(new ZodValidationPipe(eventIdParamSchema)) idParam: EventIdParamSchema,
	): Promise<EventAnalyticsChartSimpleResponseSchema> {
		return this.service.getChart(idParam.id);
	}
}
