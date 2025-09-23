import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { badges } from "./badges";
import { events } from "./events";

export const eventsBadges = pgTable(
	"events_badges",
	{
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id),
		badgeId: uuid("badge_id")
			.notNull()
			.references(() => badges.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.eventId, t.badgeId] }),
	}),
);

export type EventBadge = typeof eventsBadges.$inferSelect;
export type NewEventBadge = typeof eventsBadges.$inferInsert;
export type UpdateEventBadge = Partial<typeof eventsBadges.$inferInsert>;
