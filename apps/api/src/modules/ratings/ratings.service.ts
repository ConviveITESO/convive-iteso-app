import { Inject, Injectable } from "@nestjs/common";
import { CreateRatingSchema, UpdateRatingSchema } from "@repo/schemas";
import { and, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { ratings } from "../database/schemas";

@Injectable()
export class RatingsService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async getRatingByPrimaryKey(userId: string, eventId: string) {
		return await this.db.query.ratings.findFirst({
			where: and(eq(ratings.userId, userId), eq(ratings.eventId, eventId)),
		});
	}

	async addRatingToEvent(eventId: string, userId: string, ratingData: CreateRatingSchema) {
		const created = await this.db
			.insert(ratings)
			.values({ eventId, userId, ...ratingData })
			.returning();
		return created[0];
	}

	async updateRatingToEvent(eventId: string, userId: string, ratingData: UpdateRatingSchema) {
		const rating = await this.getRatingByPrimaryKey(userId, eventId);
		if (!rating) return null;
		rating.score = ratingData.score;
		await this.db
			.update(ratings)
			.set({ ...ratingData })
			.where(and(eq(ratings.userId, userId), eq(ratings.eventId, eventId)));
		return rating;
	}

	async deleteRatingFromEvent(userId: string, eventId: string) {
		const rating = await this.getRatingByPrimaryKey(userId, eventId);
		if (!rating) return null;
		await this.db
			.delete(ratings)
			.where(and(eq(ratings.userId, userId), eq(ratings.eventId, eventId)));
		return rating;
	}
}
