// event-impressions.ts

import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const eventImpressions = pgTable(
	"event_impressions",
	{
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id),
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		occurredAt: timestamp("occurred_at", { mode: "date" }).defaultNow().notNull(),
	},
	(t) => ({
		idxEventTime: index("event_impr_event_time_idx").on(t.eventId, t.occurredAt),
		idxEventUser: index("event_impr_event_user_idx").on(t.eventId, t.userId),
	}),
);
