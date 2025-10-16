import { integer, pgEnum, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { timestampColumns } from "./default-columns";
import { events } from "./events";
import { users } from "./users";

export const subscriptionStatus = pgEnum("subscription_status", [
	"registered",
	"waitlisted",
	"cancelled",
	"attended",
]);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id),
		status: subscriptionStatus().default("registered").notNull(),
		position: integer("position"),
		...timestampColumns,
	},
	(table) => ({
		uniqueUserEvent: unique().on(table.userId, table.eventId),
	}),
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UpdateSubscription = Partial<typeof subscriptions.$inferInsert>;
