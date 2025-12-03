/* istanbul ignore file */
import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateCommentSchema,
	commentByEventResponseSchema,
	createCommentSchema,
	eventIdParamSchema,
	UpdateCommentSchema,
	updateCommentSchema,
} from "@repo/schemas";
import { ZodBody, ZodOk, ZodParam } from "@/pipes/zod-validation/zod-validation.pipe";
import { UserRequest } from "@/types/user.request";
import { AuthGuard } from "../auth/guards/auth.guard";
import { CommentsService } from "./comments.service";

@Controller("comments")
@ApiTags("Comments")
@UseGuards(AuthGuard)
export class CommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	// GET /comments/event/:id
	@Get("event/:id")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(commentByEventResponseSchema)
	async getAllCommentsFromEvent(@Param("id") eventId: string) {
		return await this.commentsService.getAllCommentsByEvent(eventId);
	}

	// POST /comments/event/:id
	@Post("event/:id")
	@ZodParam(eventIdParamSchema, "id")
	@ZodBody(createCommentSchema)
	async addCommentToEvent(
		@Body() { comment }: CreateCommentSchema,
		@Req() request: UserRequest,
		@Param("id") eventId: string,
	) {
		const userId = request.user.id;
		const created = await this.commentsService.addCommentToEvent(eventId, userId, comment);
		return created;
	}

	// PATCH /comments/:id
	@Patch(":id")
	@ZodParam(eventIdParamSchema, "id")
	@ZodBody(updateCommentSchema)
	async updateComment(
		@Body() { comment }: UpdateCommentSchema,
		@Param("id") commentId: number,
		@Req() request: UserRequest,
	) {
		const userId = request.user.id;
		const commentExists = await this.commentsService.getCommentByIdByUser(userId, commentId);
		if (!commentExists) throw new NotFoundException("The comment was not found");
		return await this.commentsService.updateCommentById(commentId, comment);
	}
}
