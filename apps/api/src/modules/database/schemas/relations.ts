import { relations } from "drizzle-orm";
import { badges } from "./badges";
import { categories } from "./categories";
import { comments } from "./comments";
import { events } from "./events";
import { eventsBadges } from "./events-badges";
import { eventsCategories } from "./events-categories";
import { groups } from "./groups";
import { locations } from "./locations";
import { ratings } from "./ratings";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
	createdEvents: many(events),
	createdGroups: many(groups),
	createdBadges: many(badges),
	createdCategories: many(categories),
	createdLocations: many(locations),
	comments: many(comments),
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

export const groupsRelations = relations(groups, ({ one }) => ({
	creator: one(users, {
		fields: [groups.createdBy],
		references: [users.id],
	}),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
	creator: one(users, {
		fields: [locations.createdBy],
		references: [users.id],
	}),
	events: many(events),
}));

export const badgesRelations = relations(badges, ({ one, many }) => ({
	creator: one(users, {
		fields: [badges.createdBy],
		references: [users.id],
	}),
	eventsBadges: many(eventsBadges),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	creator: one(users, {
		fields: [categories.createdBy],
		references: [users.id],
	}),
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

export const usersRatings = relations(ratings, ({ one }) => {
	return {
		user: one(users, { fields: [ratings.userId], references: [users.id] }),
		event: one(events, { fields: [ratings.eventId], references: [events.id] }),
	};
});

export const commentsRelations = relations(comments, ({ one }) => {
	return {
		user: one(users, { fields: [comments.userId], references: [users.id] }),
		event: one(events, { fields: [comments.eventId], references: [events.id] }),
	};
});
