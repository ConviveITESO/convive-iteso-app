import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateEventSchema,
	createEventSchema,
	EventIdParamSchema,
	EventResponseSchema,
	eventIdParamSchema,
	eventResponseSchema,
	UpdateEventSchema,
	updateEventSchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodParam,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserRequest } from "@/types/user.request";
import { AuthGuard } from "../auth/guards/auth.guard";
import { EventService } from "./event.service";

@ApiTags("Event")
@Controller("events")
@UseGuards(AuthGuard)
export class EventController {
	constructor(private readonly eventsService: EventService) {}

	// GET /events/:id
	@Get(":id")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(eventResponseSchema)
	async getEventById(
		@Param(new ZodValidationPipe(eventIdParamSchema)) idParam: EventIdParamSchema,
	): Promise<EventResponseSchema> {
		const event = await this.eventsService.getEventByIdOrThrow(idParam.id);
		return event;
	}

	// POST /events
	@Post()
	@ZodBody(createEventSchema)
	@ZodCreated(eventResponseSchema)
	async createEvent(
		@Body(new ZodValidationPipe(createEventSchema)) data: CreateEventSchema,
		@Req() req: UserRequest,
	): Promise<EventResponseSchema> {
		const userId = req.user.id;
		const eventId = await this.eventsService.createEvent(data, userId);
		const event = await this.eventsService.getEventByIdOrThrow(eventId);
		return event;
	}

	// PUT /events/:id
	@Put(":id")
	@ZodBody(updateEventSchema)
	@ZodOk(eventResponseSchema)
	async updateEvent(
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateEventSchema)) data: UpdateEventSchema,
		@Req() req: UserRequest,
	): Promise<EventResponseSchema> {
		const userId = req.user.id;
		await this.eventsService.updateEvent(data, id, userId);
		return this.eventsService.getEventByIdOrThrow(id);
	}
}
