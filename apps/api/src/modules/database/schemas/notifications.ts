import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { events } from "./events";
import { users } from "./users";

export const notificationKind = pgEnum("notification_kind", [
	"canceled",
	"rescheduled",
	"reminder",
	"location",
]);

export const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),

	kind: notificationKind("kind").notNull(),
	title: text("title").notNull(),
	body: text("body").notNull(),

	metaOriginalDate: timestamp("meta_original_date", { mode: "date" }),
	metaNewDate: timestamp("meta_new_date", { mode: "date" }),
	metaLocation: text("meta_location"),

	readAt: timestamp("read_at", { mode: "date" }),
	...defaultColumns, // createdAt, updatedAt, status, deletedAt
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
