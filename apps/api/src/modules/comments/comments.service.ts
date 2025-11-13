import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { comments } from "../database/schemas";

@Injectable()
export class CommentsService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async getAllCommentsByEvent(eventId: string) {
		return await this.db.query.comments.findMany({
			columns: {
				id: true,
				createdAt: true,
				updatedAt: true,
				commentText: true,
			},
			where: eq(comments.eventId, eventId),
			with: {
				user: {
					columns: {
						name: true,
						profile: true,
					},
				},
			},
			orderBy: () => desc(comments.createdAt),
		});
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

	async updateCommentById(commentId: number, text: string) {
		return await this.db
			.update(comments)
			.set({ commentText: text })
			.where(eq(comments.id, commentId));
	}

	// TODO: complete
	async deleteComment() {}
}
