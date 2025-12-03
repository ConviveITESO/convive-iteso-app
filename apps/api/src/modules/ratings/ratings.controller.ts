/* istanbul ignore file */
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Logger,
	NotFoundException,
	Param,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateRatingSchema, createRatingSchema, eventIdParamSchema } from "@repo/schemas";
import { ZodBody, ZodParam, ZodValidationPipe } from "@/pipes/zod-validation/zod-validation.pipe";
import { UserRequest } from "@/types/user.request";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RatingsService } from "./ratings.service";

@ApiTags("Rating")
@Controller("ratings")
@UseGuards(AuthGuard)
export class RatingsController {
	private readonly logger = new Logger(RatingsController.name);

	constructor(private readonly ratingsService: RatingsService) {}

	// POST /ratings/event/:id
	@Post("event/:id")
	@ZodParam(eventIdParamSchema, "id")
	@ZodBody(createRatingSchema, "id")
	async addRatingToEvent(
		@Param("id") eventId: string,
		@Req() request: UserRequest,
		@Body(new ZodValidationPipe(createRatingSchema)) data: CreateRatingSchema,
	) {
		this.logger.log(`Rating event ${eventId} with a ${data.score} score`);
		const createdRating = await this.ratingsService.addRatingToEvent(
			eventId,
			request.user.id,
			data,
		);

		if (createdRating === null)
			throw new BadRequestException("Could not create rating, invalid operation"); // With result pattern, the error should be more explicit

		return createdRating;
	}

	// DELETE /ratings/event/:id
	@Delete("event/:id")
	@ZodParam(eventIdParamSchema, "id")
	async removeRatingToEvent(@Param("id") eventId: string, @Req() request: UserRequest) {
		this.logger.log(`Removing a rating on event ${eventId}`);
		const deleted = await this.ratingsService.deleteRatingFromEvent(request.user.id, eventId);
		if (!deleted)
			throw new NotFoundException(
				`Rating for event ${eventId} given by ${request.user.name} was NOT FOUND`,
			);
		return deleted;
	}
}
