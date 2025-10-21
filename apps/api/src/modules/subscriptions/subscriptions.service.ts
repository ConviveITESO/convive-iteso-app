import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common";
import {
	CreateSubscriptionSchema,
	EventStatsResponseSchema,
	SubscribedEventResponseArraySchema,
	SubscriptionCheckInResponseSchema,
	SubscriptionIdResponseSchema,
	SubscriptionQuerySchema,
	SubscriptionResponseSchema,
	UpdateSubscriptionSchema,
} from "@repo/schemas";
import { and, eq, gte, isNull, max, ne, SQL, sql } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION, Transaction } from "../database/connection";
import { events, groups, locations, Subscription, subscriptions, users } from "../database/schemas";
import { NotificationsQueueService } from "../notifications/notifications.service";

@Injectable()
export class SubscriptionsService {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly notificationsQueue: NotificationsQueueService,
	) {}
	/**
	 * Gets the QR code data for a specific event and user
	 * @param eventId The event ID
	 * @param userId The user ID
	 * @returns QR code data including event name, date, and attendee info
	 */
	async getQrCode(eventId: string, userId: string): Promise<SubscriptionResponseSchema> {
		// Check if subscription exists and is valid
		const subscription = await this.db
			.select({
				id: subscriptions.id,
				userId: subscriptions.userId,
				eventId: subscriptions.eventId,
				status: subscriptions.status,
				position: subscriptions.position,
				createdAt: subscriptions.createdAt,
				updatedAt: subscriptions.updatedAt,
				deletedAt: subscriptions.deletedAt,
			})
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.eventId, eventId),
					eq(subscriptions.userId, userId),
					eq(subscriptions.status, "registered"),
				),
			)
			.limit(1)
			.then((results) => results[0]);

		if (!subscription) {
			throw new NotFoundException("Subscription not found or not valid");
		}

		return this.toSubscriptionResponse(subscription);
	}

	/**
	 * Validates and records an event check-in
	 * @param eventId The event ID provided by the staff member
	 * @param subscriptionId The subscription ID provided via QR/manual entry
	 * @returns Result of the check-in attempt
	 */
	async checkIn(
		eventId: string,
		subscriptionId: string,
	): Promise<SubscriptionCheckInResponseSchema> {
		return await this.db.transaction(async (tx) => {
			const [record] = await tx
				.select({
					subscription: subscriptions,
					event: events,
					user: users,
				})
				.from(subscriptions)
				.innerJoin(events, eq(events.id, subscriptions.eventId))
				.innerJoin(users, eq(users.id, subscriptions.userId))
				.where(and(eq(subscriptions.id, subscriptionId), isNull(subscriptions.deletedAt)))
				.limit(1);

			if (!record) {
				throw new NotFoundException({
					status: "invalid_subscription",
					message: "Registration not found",
				});
			}

			if (record.event.id !== eventId) {
				throw new BadRequestException({
					status: "invalid_event",
					message: "Registration does not belong to this event",
				});
			}

			if (record.subscription.status === "attended") {
				return {
					status: "already_checked_in",
					message: "Attendee already checked in",
					attendeeName: record.user.name,
					subscription: this.toSubscriptionResponse(record.subscription),
				};
			}

			if (record.subscription.status !== "registered") {
				throw new BadRequestException({
					status: "invalid_subscription",
					message: "Registration is not confirmed",
				});
			}

			const [updated] = await tx
				.update(subscriptions)
				.set({
					status: "attended",
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.id, record.subscription.id))
				.returning();

			if (!updated) {
				throw new InternalServerErrorException({
					status: "invalid_subscription",
					message: "Unable to record check-in",
				});
			}

			return {
				status: "success",
				message: "Check-in completed",
				attendeeName: record.user.name,
				subscription: this.toSubscriptionResponse(updated),
			};
		});
	}

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

	async getEventAlreadyRegistered(
		eventId: string,
		userId: string,
	): Promise<SubscriptionIdResponseSchema> {
		const [subscription] = await this.db
			.select({ id: subscriptions.id })
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.eventId, eventId),
					eq(subscriptions.userId, userId),
					ne(subscriptions.status, "cancelled"),
					isNull(subscriptions.deletedAt),
				),
			)
			.limit(1);

		if (!subscription) {
			throw new NotFoundException("Subscription not found");
		}

		return { id: subscription.id };
	}

	async getUserSubscribedEvents(userId: string): Promise<SubscribedEventResponseArraySchema> {
		const rows = await this.db
			.select({
				subscriptionId: subscriptions.id,
				id: events.id,
				name: events.name,
				startDate: events.startDate,
				imageUrl: events.imageUrl,
				locationName: locations.name,
			})
			.from(subscriptions)
			.innerJoin(events, and(eq(events.id, subscriptions.eventId), eq(events.status, "active")))
			.innerJoin(users, and(eq(users.id, events.createdBy), eq(users.status, "active")))
			.innerJoin(groups, and(eq(groups.id, events.groupId), eq(groups.status, "active")))
			.innerJoin(
				locations,
				and(eq(locations.id, events.locationId), eq(locations.status, "active")),
			)
			.where(
				and(
					eq(subscriptions.userId, userId),
					ne(subscriptions.status, "cancelled"),
					isNull(subscriptions.deletedAt),
				),
			);

		return rows.map((row) => ({
			subscriptionId: row.subscriptionId,
			id: row.id,
			name: row.name,
			startDate: row.startDate instanceof Date ? row.startDate.toISOString() : row.startDate,
			imageUrl: row.imageUrl,
			location: {
				name: row.locationName,
			},
		}));
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
		const { notificationPayload, subscription } = await this.db.transaction(
			async (
				tx,
			): Promise<{
				subscription: SubscriptionResponseSchema;
				notificationPayload: {
					creatorEmail: string;
					creatorName: string;
					eventName: string;
					subscriberName: string;
				} | null;
			}> => {
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

				const [eventCreator] = await tx
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
					})
					.from(users)
					.where(eq(users.id, event.createdBy))
					.limit(1);

				if (!eventCreator) {
					throw new NotFoundException("Event creator not found");
				}

				const [subscriber] = await tx
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
					})
					.from(users)
					.where(eq(users.id, userId))
					.limit(1);

				if (!subscriber) {
					throw new NotFoundException("Subscriber not found");
				}

				if (existingSubscription) {
					// Check if subscription was deleted
					if (existingSubscription.deletedAt || existingSubscription.status === "cancelled") {
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

						return {
							subscription: this.toSubscriptionResponse(restored),
							notificationPayload: {
								creatorEmail: eventCreator.email,
								creatorName: eventCreator.name,
								eventName: event.name,
								subscriberName: subscriber.name,
							},
						};
					}

					// Idempotent - return existing subscription
					return {
						subscription: this.toSubscriptionResponse(existingSubscription),
						notificationPayload: null,
					};
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

				return {
					subscription: this.toSubscriptionResponse(result),
					notificationPayload: {
						creatorEmail: eventCreator.email,
						creatorName: eventCreator.name,
						eventName: event.name,
						subscriberName: subscriber.name,
					},
				};
			},
		);

		if (notificationPayload) {
			await this.notificationsQueue.enqueueSubscriptionCreated(notificationPayload);
		}

		return subscription;
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
