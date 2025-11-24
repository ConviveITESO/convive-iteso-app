import { Inject, Injectable, Logger } from "@nestjs/common";
import { CreateRatingSchema, UpdateRatingSchema } from "@repo/schemas";
import { and, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { events, ratings } from "../database/schemas";

@Injectable()
export class RatingsService {
	private readonly logger = new Logger(RatingsService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * Gets a rating by a given primary key (`userId` and `eventId`)
	 * @param userId The user who gave the rating
	 * @param eventId The event that was rated
	 * @returns The rating if exists or `undefined`
	 */
	async getRatingByPrimaryKey(userId: string, eventId: string) {
		return await this.db.query.ratings.findFirst({
			where: and(eq(ratings.userId, userId), eq(ratings.eventId, eventId)),
		});
	}

	/**
	 * Creates a new rating on a given event. The event must be already finished so that it can be rated
	 * @param eventId The id of the event to add the rating to
	 * @param userId The id of the user rating the event
	 * @param ratingData {score: number} The score givent to the rating
	 * @returns `null` if the rating could not be created or the created rating
	 */
	async addRatingToEvent(eventId: string, userId: string, ratingData: CreateRatingSchema) {
		const event = await this.db.query.events.findFirst({ where: eq(events.id, eventId) }); // NOTE: using db directly since event service query is too complex for this
		if (!event) return null; // TODO: Create business side result pattern. For now, null indicates a client side mistake

		const endDate = new Date(event.endDate);

		// The event has not ended
		if (Date.now() < endDate.getTime()) {
			this.logger.warn(
				`Rating ${ratingData.score} was given to event ${eventId}, however the event is not finished yet.`,
			);
			return null;
		}

		const [created] = await this.db
			.insert(ratings)
			.values({ eventId, userId, ...ratingData })
			.returning();
		return created;
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

	/**
	 * Performs a HARD DELETE of a rating in a given event
	 * @param userId The id of the user who gave the rating
	 * @param eventId The id of the event to remove the rating from
	 * @returns The deleted rating
	 */
	async deleteRatingFromEvent(userId: string, eventId: string) {
		const rating = await this.getRatingByPrimaryKey(userId, eventId);
		if (!rating) return null;
		await this.db
			.delete(ratings)
			.where(and(eq(ratings.userId, userId), eq(ratings.eventId, eventId)));
		return rating;
	}
}
