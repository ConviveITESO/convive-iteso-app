import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const chatMessages = pgTable("chat_messages", {
	id: uuid("id").defaultRandom().primaryKey(),
	eventId: uuid("event_id")
		.notNull()
		.references(() => events.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
