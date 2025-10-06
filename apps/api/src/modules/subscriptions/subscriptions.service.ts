import {
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common";
import {
	CreateSubscriptionSchema,
	EventStatsResponseSchema,
	SubscriptionQuerySchema,
	SubscriptionResponseSchema,
	UpdateSubscriptionSchema,
} from "@repo/schemas";
import { and, eq, gte, isNull, max, SQL, sql } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION, Transaction } from "../database/connection";
import { events, Subscription, subscriptions } from "../database/schemas";

@Injectable()
export class SubscriptionsService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * Converts a subscription to a subscription response
	 * @param subscription The subscription to convert
	 * @returns The subscription response
	 */
	private toSubscriptionResponse(subscription: Subscription): SubscriptionResponseSchema {
		return {
			id: subscription.id,
			userId: subscription.userId,
			eventId: subscription.eventId,
			status: subscription.status,
			position: subscription.position,
		};
	}

	/**
	 * Determines subscription status and position based on event quota
	 * @param tx Database transaction
	 * @param eventId The event ID
	 * @returns Object with status and position
	 */
	private async determineSubscriptionStatus(
		tx: Transaction,
		eventId: string,
		eventQuota: number,
	): Promise<{ status: "registered" | "waitlisted"; position: number | null }> {
		// Check current registration count
		let registrationCount = await tx.$count(
			subscriptions,
			and(
				eq(subscriptions.eventId, eventId),
				eq(subscriptions.status, "registered"),
				isNull(subscriptions.deletedAt),
			),
		);

		if (!registrationCount) {
			registrationCount = 0;
		}

		let status: "registered" | "waitlisted" = "registered";
		let position: number | null = null;

		// If event is full, add to waitlist
		if (registrationCount >= eventQuota) {
			status = "waitlisted";
			// Get next position in waitlist
			const [maxPosition] = await tx
				.select({ max: max(subscriptions.position) })
				.from(subscriptions)
				.where(
					and(
						eq(subscriptions.eventId, eventId),
						eq(subscriptions.status, "waitlisted"),
						isNull(subscriptions.deletedAt),
					),
				)
				.limit(1);

			position = (maxPosition?.max || 0) + 1;
		}

		return { status, position };
	}

	/**
	 * Promotes the next user from waitlist to registered
	 * @param tx Database transaction
	 * @param eventId The event ID
	 */
	private async promoteFromWaitlist(tx: Transaction, eventId: string) {
		// Get next user in waitlist
		const [nextWaitlisted] = await tx
			.select()
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.eventId, eventId),
					eq(subscriptions.status, "waitlisted"),
					isNull(subscriptions.deletedAt),
				),
			)
			.orderBy(subscriptions.position)
			.limit(1);

		if (!nextWaitlisted) {
			return;
		}

		if (!nextWaitlisted.position) {
			throw new InternalServerErrorException("Next waitlisted user has no position");
		}

		// Promote to registered
		await tx
			.update(subscriptions)
			.set({
				status: "registered",
				position: null,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.id, nextWaitlisted.id));

		// Update positions for remaining waitlisted users
		await tx
			.update(subscriptions)
			.set({
				position: sql`${subscriptions.position} - 1`,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(subscriptions.eventId, eventId),
					eq(subscriptions.status, "waitlisted"),
					gte(subscriptions.position, nextWaitlisted.position),
				),
			);
	}

	/**
	 * Gets all subscriptions for a user with optional filtering
	 * @param userId The user ID
	 * @param query Query parameters for filtering
	 * @returns all subscriptions matching the criteria
	 */
	async getUserSubscriptions(
		userId: string,
		query?: SubscriptionQuerySchema,
	): Promise<SubscriptionResponseSchema[]> {
		const conditions: SQL[] = [eq(subscriptions.userId, userId), isNull(subscriptions.deletedAt)];

		if (query?.status) {
			conditions.push(eq(subscriptions.status, query.status));
		}
		if (query?.eventId) {
			conditions.push(eq(subscriptions.eventId, query.eventId));
		}

		const result = await this.db
			.select()
			.from(subscriptions)
			.where(and(...conditions));

		if (!result) {
			throw new NotFoundException("Subscriptions not found");
		}

		return result.map((subscription) => this.toSubscriptionResponse(subscription));
	}

	/**
	 * Gets a single subscription by its id
	 * @param subscriptionId The ID of the subscription
	 * @param userId The user ID (for authorization)
	 * @returns The subscription or undefined
	 */
	async getSubscriptionById(
		subscriptionId: string,
		userId: string,
	): Promise<SubscriptionResponseSchema> {
		const [subscription] = await this.db
			.select()
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.id, subscriptionId),
					eq(subscriptions.userId, userId),
					isNull(subscriptions.deletedAt),
				),
			)
			.limit(1);

		if (!subscription) {
			throw new NotFoundException("Subscription not found");
		}

		return this.toSubscriptionResponse(subscription);
	}

	/**
	 * Gets subscription statistics for an event
	 * @param eventId The event ID
	 * @returns Event statistics including registered count, waitlisted count, and spots left
	 */
	async getEventStats(eventId: string): Promise<EventStatsResponseSchema> {
		// Verify event exists
		const [event] = await this.db.select().from(events).where(eq(events.id, eventId)).limit(1);

		if (!event) {
			throw new NotFoundException("Event not found");
		}

		// Get registered count
		const registeredCount =
			(await this.db.$count(
				subscriptions,
				and(
					eq(subscriptions.eventId, eventId),
					eq(subscriptions.status, "registered"),
					isNull(subscriptions.deletedAt),
				),
			)) || 0;

		// Get waitlisted count
		const waitlistedCount =
			(await this.db.$count(
				subscriptions,
				and(
					eq(subscriptions.eventId, eventId),
					eq(subscriptions.status, "waitlisted"),
					isNull(subscriptions.deletedAt),
				),
			)) || 0;

		// Calculate spots left
		const spotsLeft = Math.max(0, event.quota - registeredCount);

		return {
			eventId,
			registeredCount,
			waitlistedCount,
			spotsLeft,
		};
	}

	/**
	 * Creates a new subscription (registers user for event)
	 * @param userId The user ID
	 * @param data Subscription data
	 * @returns The created subscription
	 */
	async createSubscription(
		userId: string,
		data: CreateSubscriptionSchema,
	): Promise<SubscriptionResponseSchema> {
		return await this.db.transaction(async (tx): Promise<SubscriptionResponseSchema> => {
			// Check if user is already registered for this event
			const [existingSubscription] = await tx
				.select()
				.from(subscriptions)
				.where(and(eq(subscriptions.userId, userId), eq(subscriptions.eventId, data.eventId)))
				.limit(1);

			// Get event details
			const [event] = await tx.select().from(events).where(eq(events.id, data.eventId)).limit(1);

			if (!event) {
				throw new NotFoundException("Event not found");
			}

			if (existingSubscription) {
				// Check if subscription was deleted
				if (existingSubscription.deletedAt) {
					// Determine if user can be registered or should be waitlisted
					const { status, position } = await this.determineSubscriptionStatus(
						tx,
						data.eventId,
						event.quota,
					);

					// Restore subscription by clearing deletedAt and updating status
					const [restored] = await tx
						.update(subscriptions)
						.set({
							status,
							position,
							deletedAt: null,
							updatedAt: new Date(),
						})
						.where(eq(subscriptions.id, existingSubscription.id))
						.returning();

					if (!restored) {
						throw new InternalServerErrorException("Failed to restore subscription");
					}

					return this.toSubscriptionResponse(restored);
				}

				// Idempotent - return existing subscription
				return this.toSubscriptionResponse(existingSubscription);
			}

			// Check registration window
			const now = new Date();
			if (event.opensAt && now < event.opensAt) {
				throw new ForbiddenException("Registration not yet open");
			}
			if (event.closesAt && now > event.closesAt) {
				throw new ForbiddenException("Registration has closed");
			}

			// Determine subscription status and position
			const { status, position } = await this.determineSubscriptionStatus(
				tx,
				data.eventId,
				event.quota,
			);

			// Create subscription
			const [result] = await tx
				.insert(subscriptions)
				.values({
					userId,
					eventId: data.eventId,
					status,
					position,
				})
				.returning();

			if (!result) {
				throw new InternalServerErrorException("Failed to create subscription");
			}

			return this.toSubscriptionResponse(result);
		});
	}

	/**
	 * Updates a subscription (mainly for cancellation)
	 * @param subscriptionId The subscription ID
	 * @param userId The user ID (for authorization)
	 * @param data The data for update
	 * @returns The updated subscription or undefined
	 */
	async updateSubscription(
		subscriptionId: string,
		userId: string,
		data: UpdateSubscriptionSchema,
	): Promise<SubscriptionResponseSchema> {
		return await this.db.transaction(async (tx): Promise<SubscriptionResponseSchema> => {
			// Get existing subscription
			const [subscription] = await tx
				.select({
					subscription: subscriptions,
					event: events,
				})
				.from(subscriptions)
				.innerJoin(events, eq(events.id, subscriptions.eventId))
				.where(
					and(
						eq(subscriptions.id, subscriptionId),
						eq(subscriptions.userId, userId),
						isNull(subscriptions.deletedAt),
					),
				)
				.limit(1);

			if (!subscription) {
				throw new NotFoundException("Subscription not found");
			}

			// Check if cancellation is allowed
			if (data.status === "cancelled") {
				const now = new Date();
				if (subscription.event.unregisterClosesAt && now > subscription.event.unregisterClosesAt) {
					throw new ForbiddenException("Unregistration period has closed");
				}

				// If user was registered, promote next waitlisted user
				if (subscription.subscription.status === "registered") {
					await this.promoteFromWaitlist(tx, subscription.subscription.eventId);
				}
			}

			// Update subscription
			const [result] = await tx
				.update(subscriptions)
				.set({ ...data, updatedAt: new Date() })
				.where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
				.returning();

			if (!result) {
				throw new NotFoundException("Failed to update subscription");
			}

			return this.toSubscriptionResponse(result);
		});
	}

	/**
	 * Soft deletes a subscription (unregisters user)
	 * @param subscriptionId The subscription ID
	 * @param userId The user ID (for authorization)
	 * @returns The deleted subscription or undefined
	 */
	async deleteSubscription(subscriptionId: string, userId: string): Promise<{ message: string }> {
		return await this.db.transaction(async (tx) => {
			const [subscription] = await tx
				.select({
					subscription: subscriptions,
					event: events,
				})
				.from(subscriptions)
				.innerJoin(events, eq(events.id, subscriptions.eventId))
				.where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
				.limit(1);

			if (!subscription) {
				throw new NotFoundException("Subscription not found");
			}

			// Check if cancellation is allowed
			const now = new Date();
			if (subscription.event.unregisterClosesAt && now > subscription.event.unregisterClosesAt) {
				throw new ForbiddenException("Unregistration period has closed");
			}

			// If user was registered, promote next waitlisted user
			if (subscription.subscription.status === "registered") {
				await this.promoteFromWaitlist(tx, subscription.subscription.eventId);
			}

			// Soft delete by updating status to cancelled
			await tx
				.update(subscriptions)
				.set({
					status: "cancelled",
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.id, subscriptionId));

			return { message: "Subscription cancelled successfully" };
		});
	}
}
