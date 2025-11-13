import { integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const ratings = pgTable(
	"ratings",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id),
		score: integer().notNull(), // 1 - 5 stars,
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp()
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [primaryKey({ columns: [table.eventId, table.userId] })],
);
