import { relations } from "drizzle-orm";
import { badges } from "./badges";
import { categories } from "./categories";
import { events } from "./events";
import { eventsBadges } from "./events-badges";
import { eventsCategories } from "./events-categories";
import { groups } from "./groups";
import { locations } from "./locations";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
	createdEvents: many(events),
	createdGroups: many(groups),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
	creator: one(users, {
		fields: [events.createdBy],
		references: [users.id],
	}),
	location: one(locations, {
		fields: [events.locationId],
		references: [locations.id],
	}),
	group: one(groups, {
		fields: [events.groupId],
		references: [groups.id],
	}),
	eventsBadges: many(eventsBadges),
	eventsCategories: many(eventsCategories),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
	creator: one(users, {
		fields: [groups.createdBy],
		references: [users.id],
	}),
	events: many(events),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
	events: many(events),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
	eventsBadges: many(eventsBadges),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
	eventsCategories: many(eventsCategories),
}));

export const eventsBadgesRelations = relations(eventsBadges, ({ one }) => ({
	event: one(events, {
		fields: [eventsBadges.eventId],
		references: [events.id],
	}),
	badge: one(badges, {
		fields: [eventsBadges.badgeId],
		references: [badges.id],
	}),
}));

export const eventsCategoriesRelations = relations(eventsCategories, ({ one }) => ({
	event: one(events, {
		fields: [eventsCategories.eventId],
		references: [events.id],
	}),
	category: one(categories, {
		fields: [eventsCategories.categoryId],
		references: [categories.id],
	}),
}));
