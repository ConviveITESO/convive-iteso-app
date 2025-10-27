import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express/multer/interceptors/file.interceptor";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateEventSchema,
	CreatorEventResponseArraySchema,
	createEventSchema,
	creatorEventResponseArraySchema,
	EventIdParamSchema,
	EventResponseSchema,
	eventIdParamSchema,
	eventResponseSchema,
	GetEventsQuerySchema,
	getEventsQuerySchema,
	UpdateEventSchema,
	updateEventSchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodParam,
	ZodQuery,
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

	// GET /events
	@Get()
	@ZodQuery(getEventsQuerySchema, "queryEvents")
	@ZodOk(eventResponseSchema)
	async getEvents(
		@Query(new ZodValidationPipe(getEventsQuerySchema)) query: GetEventsQuerySchema,
	): Promise<EventResponseSchema[]> {
		return this.eventsService.getEvents(query);
	}

	// GET /events/created
	@Get("created")
	@ZodOk(creatorEventResponseArraySchema)
	async getEventsCreatedByUser(@Req() req: UserRequest): Promise<CreatorEventResponseArraySchema> {
		return this.eventsService.getEventsCreatedByUser(req.user.id);
	}

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
	@UseInterceptors(FileInterceptor("image"))
	async createEvent(
		@Body() rawBody: Record<string, unknown>,
		@Req() req: UserRequest,
		@UploadedFile() imageFile: Express.Multer.File,
	): Promise<EventResponseSchema> {
		const json = rawBody.data;
		if (!json) throw new BadRequestException("Missing event data");

		const result = createEventSchema.safeParse(JSON.parse(json as string));
		if (!result.success) {
			throw new BadRequestException("Invalid event data");
		}

		if (!imageFile || !imageFile.mimetype.startsWith("image/")) {
			throw new BadRequestException("Invalid or missing image file");
		}

		const data: CreateEventSchema = result.data;
		const userId = req.user.id;
		const eventId = await this.eventsService.createEvent(data, userId, imageFile);
		const event = await this.eventsService.getEventByIdOrThrow(eventId);
		return event;
	}

	// PUT /events/:id/edit
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

	// DELETE /events/:id
	@Delete(":id")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(eventResponseSchema)
	async deleteEvent(
		@Param(new ZodValidationPipe(eventIdParamSchema)) idParam: EventIdParamSchema,
		@Req() req: UserRequest,
	): Promise<{ message: string }> {
		const user = req.user;
		await this.eventsService.deleteEvent(idParam.id, user);
		return { message: "Event deleted successfully" };
	}
}
