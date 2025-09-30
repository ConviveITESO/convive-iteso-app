import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateEventSchema, EventResponseSchema, UpdateEventSchema } from "@repo/schemas";
import { and, eq, sql } from "drizzle-orm";
import { BadgeService } from "../badge/badge.service";
import { CategoryService } from "../category/category.service";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import {
	Badge,
	badges,
	Category,
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

	async getEventById(id: string): Promise<EventResponseSchema | undefined> {
		const [event] = await this.db
			.select({
				event: events,
				creator: users,
				group: groups,
				location: locations,
				categories: sql<Category[]>`COALESCE(
					json_agg(
						distinct jsonb_build_object(
							'id', ${categories.id},
							'name', ${categories.name}
						)
					) filter (where ${categories.id} is not null),
					'[]'::json
				)`,
				badges: sql<Badge[]>`COALESCE(
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
			const eventId = await this._createEvent(data, userId, groupId);
			await this.createCategoryBadgeRelations(data, eventId);
			return eventId;
		});
	}

	async updateEvent(data: UpdateEventSchema, id: string): Promise<void> {
		return this.db.transaction(async () => {
			await this.getEventByIdOrThrow(id);
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
		eventCategories: Category[],
		eventBadges: Badge[],
	): EventResponseSchema {
		const group = this.groupService.formatGroup(eventGroup);
		const createdBy = this.userService.formatUser(creator);
		const location = this.locationService.formatLocation(eventLocation);
		const categories = eventCategories.map((category) =>
			this.categoryService.formatCategory(category),
		);
		const badges = eventBadges.map((badge) => this.badgeService.formatBadge(badge));
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
			categories,
			badges,
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
