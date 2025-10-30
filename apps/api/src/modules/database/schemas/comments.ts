import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const comments = pgTable("comments", {
	id: serial("id").primaryKey().notNull(), // serial keys to avoid parsing uuids for lookups
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	eventId: uuid("event_id")
		.notNull()
		.references(() => events.id),
	commentText: text("comment_text").notNull(), // TODO: should use a varchar with fixed size?
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp()
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});
