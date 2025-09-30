import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateEventSchema,
	createEventSchema,
	EventResponseSchema,
	eventResponseSchema,
} from "@repo/schemas";
import { ZodBody, ZodCreated, ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";
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
}
