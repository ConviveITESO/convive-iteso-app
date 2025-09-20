import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { badges } from "./badges";
import { events } from "./events";

export const eventsBadges = pgTable(
	"events_badges",
	{
		eventId: integer("event_id").references(() => events.id),
		badgeId: integer("badge_id").references(() => badges.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.eventId, t.badgeId] }),
	}),
);

export type EventBadge = typeof eventsBadges.$inferSelect;
export type NewEventBadge = typeof eventsBadges.$inferInsert;
export type UpdateEventBadge = Partial<typeof eventsBadges.$inferInsert>;
