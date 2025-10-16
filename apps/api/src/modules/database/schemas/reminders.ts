import { boolean, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const reminders = pgTable(
	"reminders",
	{
		id: uuid("id").defaultRandom().notNull().unique(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		firstReminderDone: boolean("first_reminder_done").notNull().default(false),
		secondReminderDone: boolean("second_reminder_done").notNull().default(false),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.eventId, t.userId] }),
	}),
);

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type UpdateReminder = Partial<typeof reminders.$inferInsert>;
