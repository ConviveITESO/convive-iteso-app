import { Body, Controller, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateEventSchema,
	createEventSchema,
	EventResponseSchema,
	eventResponseSchema,
	UpdateEventSchema,
	updateEventSchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { EventService } from "./event.service";

// TODO: auth guard, userId must be in request
@ApiTags("Event")
@Controller("events")
export class EventController {
	constructor(private readonly eventsService: EventService) {}

	// POST /events
	@Post()
	@ZodBody(createEventSchema)
	@ZodCreated(eventResponseSchema)
	async createEvent(
		@Body(new ZodValidationPipe(createEventSchema)) data: CreateEventSchema,
	): Promise<EventResponseSchema> {
		const userId = "";
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
	): Promise<EventResponseSchema> {
		await this.eventsService.updateEvent(data, id);
		return this.eventsService.getEventByIdOrThrow(id);
	}
}
