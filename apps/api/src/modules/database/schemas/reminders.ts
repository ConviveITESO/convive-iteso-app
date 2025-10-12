import { boolean, pgTable, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const reminders = pgTable("reminders", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id")
		.notNull()
		.references(() => events.id),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	firstReminderDone: boolean("first-reminder-done").notNull().default(false),
	secondReminderDone: boolean("second-reminder-done").notNull().default(false),
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type UpdateReminder = Partial<typeof reminders.$inferInsert>;
