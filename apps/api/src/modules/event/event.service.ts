import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	BadgeResponseSchema,
	CategoryResponseSchema,
	CreateEventSchema,
	EventResponseSchema,
	GetEventsQuerySchema,
	UpdateEventSchema,
} from "@repo/schemas";
import { and, eq, sql } from "drizzle-orm";
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
	User,
	users,
} from "../database/schemas";
import { GroupService } from "../group/group.service";
import { LocationService } from "../location/location.service";
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
	) {}

	async getEvents(filters: GetEventsQuerySchema): Promise<EventResponseSchema[]> {
		const where = [eq(events.status, "active")];
		if (filters.name) {
			where.push(eq(events.name, filters.name));
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
			.where(and(eq(events.id, id), eq(events.status, "active")))
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

	async createEvent(data: CreateEventSchema, userId: string): Promise<string> {
		return this.db.transaction(async () => {
			await this.assertLocationCategoriesBadgesExist(data);
			const groupId = await this.createEventGroup(data);
			await this.groupService.createSubscription(groupId, userId);
			const eventId = await this._createEvent(data, userId, groupId);
			await this.createCategoryBadgeRelations(data, eventId);
			return eventId;
		});
	}

	async updateEvent(data: UpdateEventSchema, id: string, userId: string): Promise<void> {
		return this.db.transaction(async () => {
			const event = await this.getEventByIdOrThrow(id);
			if (event.createdBy.id !== userId)
				throw new ForbiddenException("You do not have permission to edit this event");
			await this.assertLocationCategoriesBadgesExist(data);
			await this._updateEvent(data, id);
			await this.updateCategoryBadgeRelations(data, id);
		});
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
			location,
			createdBy,
			group,
			categories: eventCategories,
			badges: eventBadges,
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
}
