import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateEventSchema, EventResponseSchema } from "@repo/schemas";
import { and, eq } from "drizzle-orm";
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
		const event = await this.db.query.events.findFirst({
			with: {
				creator: true,
				group: true,
				location: true,
				eventsCategories: {
					with: { category: true },
				},
				eventsBadges: {
					with: { badge: true },
				},
			},
			where: and(
				eq(events.id, id),
				eq(events.status, "active"),
				eq(users.status, "active"),
				eq(groups.status, "active"),
				eq(locations.status, "active"),
				eq(categories.status, "active"),
				eq(badges.status, "active"),
			),
		});
		if (!event) return event;
		const categoriesFound = event.eventsCategories.map((register) => register.category);
		const badgesFound = event.eventsBadges.map((register) => register.badge);
		return this.formatEvent(
			event,
			event.creator,
			event.group,
			event.location,
			categoriesFound,
			badgesFound,
		);
	}

	async getEventByIdOrThrow(id: string): Promise<EventResponseSchema> {
		const event = await this.getEventById(id);
		if (!event) throw new NotFoundException("Event not found"); // TODO: error handling in services
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

	private async assertLocationCategoriesBadgesExist(data: CreateEventSchema): Promise<void> {
		await this.locationService.getLocationByIdOrThrow(data.locationId);
		await this.categoryService.assertCategoriesExist(data.categoryIds);
		await this.badgeService.assertBadgesExist(data.badgeIds);
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
			.returning();
		// biome-ignore lint/style/noNonNullAssertion: <>
		return event!.id;
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
