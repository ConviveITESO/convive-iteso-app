import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const todoStatusEnum = pgEnum("todoStatus", [
	"todo",
	"in_progress",
	"done",
	"cancelled",
]);

export const todos = pgTable("todos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	status: todoStatusEnum().notNull().default("todo"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
