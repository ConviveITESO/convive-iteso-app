import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { comments } from "../database/schemas";

@Injectable()
export class CommentsService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async getAllCommentsByEvent(eventId: string) {
		return await this.db.query.comments.findMany({ where: eq(comments.eventId, eventId) });
	}

	async getAllCommentsByUser(userId: string) {
		return await this.db.query.comments.findMany({ where: eq(comments.userId, userId) });
	}

	async getCommentByIdByUser(userId: string, commentId: number) {
		return await this.db.query.comments.findFirst({
			where: and(eq(comments.userId, userId), eq(comments.id, commentId)),
		});
	}

	async addCommentToEvent(eventId: string, userId: string, commentText: string) {
		const [added] = await this.db
			.insert(comments)
			.values({ eventId, userId, commentText })
			.returning();
		return added;
	}

	async updateCommentById(commentId: number, userId: string, text: string) {
		const comment = await this.getCommentByIdByUser(userId, commentId);
		if (!comment) return null;
		comment.commentText = text;

		await this.db.update(comments).set({ commentText: text }).where(eq(comments.id, commentId));

		return comment;
	}

	// TODO: complete
	async deleteComment() {}
}
