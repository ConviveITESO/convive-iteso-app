import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { groups } from "./groups";
import { users } from "./users";

export const groupMessages = pgTable("group_messages", {
	id: uuid("id").defaultRandom().primaryKey(),
	groupId: uuid("group_id")
		.notNull()
		.references(() => groups.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type GroupMessage = typeof groupMessages.$inferSelect;
export type NewGroupMessage = typeof groupMessages.$inferInsert;
