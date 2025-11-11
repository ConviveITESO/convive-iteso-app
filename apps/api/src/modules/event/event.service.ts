import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	BadgeResponseSchema,
	CategoryResponseSchema,
	CreateEventSchema,
	CreatorEventResponseArraySchema,
	EventResponseSchema,
	GetEventsCreatedByUserQuerySchema,
	GetEventsQuerySchema,
	UpdateEventSchema,
	UserResponseSchema,
} from "@repo/schemas";
import { and, eq, gt, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { BadgeService } from "../badge/badge.service";
import { CategoryService } from "../category/category.service";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import {
	badges,
	categories,
	Event,
	events,
	eventsBadges,
	eventsCategories,
	Group,
	groups,
	Location,
	locations,
	subscriptions,
	User,
	users,
} from "../database/schemas";
import { GroupService } from "../group/group.service";
import { LocationService } from "../location/location.service";
import { S3Service } from "../s3/s3.service";
import { UserService } from "../user/user.service";

@Injectable()
export class EventService {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly userService: UserService,
		private readonly groupService: GroupService,
		private readonly locationService: LocationService,
		private readonly categoryService: CategoryService,
		private readonly badgeService: BadgeService,
		private readonly s3Service: S3Service,
	) {}

	async getEvents(filters: GetEventsQuerySchema): Promise<EventResponseSchema[]> {
		const where = [eq(events.status, "active")];
		const now = new Date();
		if (filters.pastEvents === "true") {
			where.push(lt(events.endDate, now));
		} else {
			where.push(gt(events.endDate, now));
		}
		if (filters.name) {
			const search = `%${filters.name}%`;
			where.push(
				// biome-ignore lint/style/noNonNullAssertion: <>
				or(ilike(events.name, search), ilike(events.description, search), ilike(users.name, search), ilike(users.email, search))!,
			);
		}
		if (filters.locationId) {
			where.push(eq(events.locationId, filters.locationId));
		}
		if (filters.categoryId) {
			where.push(eq(eventsCategories.categoryId, filters.categoryId));
		}
		if (filters.badgeId) {
			where.push(eq(eventsBadges.badgeId, filters.badgeId));
		}
		const results = await this.db
			.select({
				event: events,
				creator: users,
				group: groups,
				location: locations,
				categories: sql<CategoryResponseSchema[]>`COALESCE(
					json_agg(
						distinct jsonb_build_object(
							'id', ${categories.id},
							'name', ${categories.name},
							'createdBy', ${categories.createdBy},
							'status', ${categories.status},
							'createdAt', to_char(${categories.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
							'updatedAt', to_char(${categories.updatedAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
							'deletedAt', to_char(${categories.deletedAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
						)
					) filter (where ${categories.id} is not null),
					'[]'::json
				)`,
				badges: sql<BadgeResponseSchema[]>`COALESCE(
					json_agg(
						distinct jsonb_build_object(
							'id', ${badges.id},
							'name', ${badges.name},
							'description', ${badges.description}
						)
					) filter (where ${badges.id} is not null),
					'[]'::json
				)`,
			})
			.from(events)
			.where(and(...where))
			.innerJoin(users, and(eq(users.id, events.createdBy), eq(users.status, "active")))
			.innerJoin(groups, and(eq(groups.id, events.groupId), eq(groups.status, "active")))
			.innerJoin(
				locations,
				and(eq(locations.id, events.locationId), eq(locations.status, "active")),
			)
			.leftJoin(eventsCategories, eq(eventsCategories.eventId, events.id))
			.leftJoin(
				categories,
				and(eq(eventsCategories.categoryId, categories.id), eq(categories.status, "active")),
			)
			.leftJoin(eventsBadges, eq(eventsBadges.eventId, events.id))
			.leftJoin(badges, and(eq(eventsBadges.badgeId, badges.id), eq(badges.status, "active")))
			.groupBy(events.id, users.id, groups.id, locations.id);

		return results.map((result) =>
			this.formatEvent(
				result.event,
				result.creator,
				result.group,
				result.location,
				result.categories,
				result.badges,
			),
		);
	}

	async getEventsCreatedByUser(
		userId: string,
		query: GetEventsCreatedByUserQuerySchema,
	): Promise<CreatorEventResponseArraySchema> {
		const rows = await this.db
			.select({
				id: events.id,
				name: events.name,
				startDate: events.startDate,
				endDate: events.endDate,
				status: events.status,
				groupId: events.groupId,
				imageUrl: events.imageUrl,
				locationName: locations.name,
				registeredCount: sql<number>`COALESCE(SUM(CASE
					WHEN ${subscriptions.status} = 'registered' AND ${subscriptions.deletedAt} IS NULL THEN 1
					ELSE 0
				END), 0)`,
				waitlistedCount: sql<number>`COALESCE(SUM(CASE
					WHEN ${subscriptions.status} = 'waitlisted' AND ${subscriptions.deletedAt} IS NULL THEN 1
					ELSE 0
				END), 0)`,
			})
			.from(events)
			.innerJoin(
				locations,
				and(eq(locations.id, events.locationId), eq(locations.status, "active")),
			)
			.leftJoin(
				subscriptions,
				and(eq(subscriptions.eventId, events.id), isNull(subscriptions.deletedAt)),
			)
			.where(and(eq(events.createdBy, userId), eq(events.status, query.status)))
			.groupBy(
				events.id,
				events.name,
				events.startDate,
				events.endDate,
				events.status,
				events.groupId,
				events.imageUrl,
				locations.name,
			);

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			startDate: row.startDate instanceof Date ? row.startDate.toISOString() : row.startDate,
			endDate: row.endDate instanceof Date ? row.endDate.toISOString() : row.endDate,
			status: row.status,
			groupId: row.groupId,
			imageUrl: row.imageUrl,
			location: {
				name: row.locationName,
			},
			attendance: {
				registered: Number(row.registeredCount ?? 0),
				waitlisted: Number(row.waitlistedCount ?? 0),
			},
		}));
	}

	async getEventById(id: string): Promise<EventResponseSchema | undefined> {
		const [event] = await this.db
			.select({
				event: events,
				creator: users,
				group: groups,
				location: locations,
				categories: sql<CategoryResponseSchema[]>`COALESCE(
					json_agg(
						distinct jsonb_build_object(
							'id', ${categories.id},
							'name', ${categories.name},
							'createdBy', ${categories.createdBy},
							'status', ${categories.status},
							'createdAt', to_char(${categories.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
							'updatedAt', to_char(${categories.updatedAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
							'deletedAt', to_char(${categories.deletedAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
						)
					) filter (where ${categories.id} is not null),
					'[]'::json
				)`,
				badges: sql<BadgeResponseSchema[]>`COALESCE(
					json_agg(
						distinct jsonb_build_object(
							'id', ${badges.id},
							'name', ${badges.name},
							'description', ${badges.description}
						)
					) filter (where ${badges.id} is not null),
					'[]'::json
				)`,
			})
			.from(events)
			.where(eq(events.id, id))
			.innerJoin(users, and(eq(users.id, events.createdBy), eq(users.status, "active")))
			.innerJoin(groups, and(eq(groups.id, events.groupId), eq(groups.status, "active")))
			.innerJoin(
				locations,
				and(eq(locations.id, events.locationId), eq(locations.status, "active")),
			)
			.leftJoin(eventsCategories, eq(eventsCategories.eventId, events.id))
			.leftJoin(
				categories,
				and(eq(eventsCategories.categoryId, categories.id), eq(categories.status, "active")),
			)
			.leftJoin(eventsBadges, eq(eventsBadges.eventId, events.id))
			.leftJoin(badges, and(eq(eventsBadges.badgeId, badges.id), eq(badges.status, "active")))
			.groupBy(events.id, users.id, groups.id, locations.id);
		if (!event) return event;
		return this.formatEvent(
			event.event,
			event.creator,
			event.group,
			event.location,
			event.categories,
			event.badges,
		);
	}

	async getEventByIdOrThrow(id: string): Promise<EventResponseSchema> {
		const event = await this.getEventById(id);
		if (!event) throw new NotFoundException("Event not found");
		return event;
	}

	async createEvent(
		data: CreateEventSchema,
		userId: string,
		imageFile: Express.Multer.File,
	): Promise<string> {
		const s3Key = `events/${Date.now()}-${imageFile.originalname}`;
		await this.s3Service.uploadFile(s3Key, imageFile.buffer, imageFile.mimetype);
		const imageUrl = await this.s3Service.getFileUrl(s3Key);

		return this.db.transaction(async () => {
			await this.assertLocationCategoriesBadgesExist(data);
			const groupId = await this.createEventGroup(data);
			await this.groupService.createSubscription(groupId, userId);
			const eventId = await this._createEvent(data, userId, groupId, imageUrl);
			await this.createCategoryBadgeRelations(data, eventId);
			return eventId;
		});
	}

	async updateEvent(data: UpdateEventSchema, id: string, userId: string): Promise<void> {
		return this.db.transaction(async () => {
			const event = await this.getEventByIdOrThrow(id);
			if (event.createdBy.id !== userId)
				throw new ForbiddenException("You do not have permission to edit this event");
			if (event.status === "deleted")
				throw new BadRequestException("The event is cancelled, it cannot be updated");
			await this.assertLocationCategoriesBadgesExist(data);
			await this._updateEvent(data, id);
			await this.updateCategoryBadgeRelations(data, id);
		});
	}

	async changeEventStatus(id: string, user: UserResponseSchema): Promise<void> {
		const event = await this.getEventByIdOrThrow(id);
		if (event.createdBy.id !== user.id && user.role !== "admin") {
			throw new ForbiddenException("You do not have permission to delete this event");
		}
		const startDate = new Date(event.startDate);
		const now = new Date();
		if (event.status === "active" && startDate <= now)
			throw new BadRequestException("The event already started, it can't be cancelled");
		const newStatus = event.status === "active" ? "deleted" : "active";
		await this.db.update(events).set({ status: newStatus }).where(eq(events.id, id));
	}

	formatEvent(
		event: Event,
		creator: User,
		eventGroup: Group,
		eventLocation: Location,
		eventCategories: CategoryResponseSchema[],
		eventBadges: BadgeResponseSchema[],
	): EventResponseSchema {
		const group = this.groupService.formatGroup(eventGroup);
		const createdBy = this.userService.formatUser(creator);
		const location = this.locationService.formatLocation(eventLocation);
		return {
			id: event.id,
			name: event.name,
			description: event.description,
			startDate: event.startDate.toISOString(),
			endDate: event.endDate.toISOString(),
			quota: event.quota,
			status: event.status,
			location,
			createdBy,
			group,
			categories: eventCategories,
			badges: eventBadges,
			imageUrl: event.imageUrl,
		};
	}

	private async assertLocationCategoriesBadgesExist(data: {
		locationId?: string;
		categoryIds?: string[];
		badgeIds?: string[];
	}): Promise<void> {
		if (data.locationId) {
			await this.locationService.getLocationByIdOrThrow(data.locationId);
		}
		if (data.categoryIds) {
			await this.categoryService.assertCategoriesExist(data.categoryIds);
		}
		if (data.badgeIds) {
			await this.badgeService.assertBadgesExist(data.badgeIds);
		}
	}

	private async createEventGroup(data: CreateEventSchema): Promise<string> {
		const groupId = await this.groupService.createEventGroup({
			name: this.eventGroupName(data.name),
			description: this.eventGroupDescription(data.name),
		});
		return groupId;
	}

	private async _createEvent(
		data: CreateEventSchema,
		userId: string,
		groupId: string,
		imageUrl: string,
	): Promise<string> {
		const [event] = await this.db
			.insert(events)
			.values({
				name: data.name,
				description: data.description,
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
				quota: data.quota,
				locationId: data.locationId,
				createdBy: userId,
				groupId,
				imageUrl,
			})
			.returning({ id: events.id });
		// biome-ignore lint/style/noNonNullAssertion: <>
		return event!.id;
	}

	private async _updateEvent(data: UpdateEventSchema, eventId: string): Promise<void> {
		const updateData: Partial<typeof events.$inferInsert> = {};

		if (data.name) updateData.name = data.name;
		if (data.description) updateData.description = data.description;
		if (data.startDate) updateData.startDate = new Date(data.startDate);
		if (data.endDate) updateData.endDate = new Date(data.endDate);
		if (data.quota) updateData.quota = data.quota;
		if (data.locationId) updateData.locationId = data.locationId;

		if (Object.keys(updateData).length > 0) {
			await this.db.update(events).set(updateData).where(eq(events.id, eventId));
		}
	}

	private async createCategoryBadgeRelations(data: CreateEventSchema, eventId: string) {
		if (data.categoryIds.length > 0)
			await this.db
				.insert(eventsCategories)
				.values(data.categoryIds.map((categoryId) => ({ eventId, categoryId })));
		if (data.badgeIds.length > 0)
			await this.db
				.insert(eventsBadges)
				.values(data.badgeIds.map((badgeId) => ({ eventId, badgeId })));
	}

	private async updateCategoryBadgeRelations(data: UpdateEventSchema, eventId: string) {
		//promise void if not works
		if (data.categoryIds) {
			await this.db.delete(eventsCategories).where(eq(eventsCategories.eventId, eventId));
			if (data.categoryIds.length > 0) {
				await this.db
					.insert(eventsCategories)
					.values(data.categoryIds.map((categoryId) => ({ eventId, categoryId })));
			}
		}
		if (data.badgeIds) {
			await this.db.delete(eventsBadges).where(eq(eventsBadges.eventId, eventId));
			if (data.badgeIds.length > 0) {
				await this.db
					.insert(eventsBadges)
					.values(data.badgeIds.map((badgeId) => ({ eventId, badgeId })));
			}
		}
	}

	// TODO: centralize the allowed length of strings, also check zod and drizzle schemas
	private eventGroupName(eventName: string): string {
		return `Group for the event: ${eventName}`.substring(0, 255);
	}

	private eventGroupDescription(eventName: string): string {
		return `This group was created to interact with other event attendees of: ${eventName}`.substring(
			0,
			1023,
		);
	}

	async updateEventImage(eventId: string, imageFile: Express.Multer.File) {
		const existingEvent = await this.db.query.events.findFirst({
			where: eq(events.id, eventId),
		});

		if (existingEvent?.imageUrl) {
			const oldKey = this.extractKeyFromUrl(existingEvent.imageUrl);
			if (oldKey) {
				await this.s3Service.deleteFile(oldKey);
			}
		}

		const key = `events/${Date.now()}-${imageFile.originalname}`;
		await this.s3Service.uploadFile(key, imageFile.buffer, imageFile.mimetype);
		const newImageUrl = await this.s3Service.getFileUrl(key);

		const updated = await this.db
			.update(events)
			.set({ imageUrl: newImageUrl })
			.where(eq(events.id, eventId))
			.returning();

		return updated[0];
	}

	private extractKeyFromUrl(url: string): string | null {
		// Extract key from S3 URL
		// For LocalStack: http://localhost:4566/bucket/key
		// For AWS: https://bucket.s3.region.amazonaws.com/key
		const match = url.match(/\/([^/]+\/[^/]+)$/);
		return match?.[1] ?? null;
	}
}
