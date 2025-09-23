import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { users } from "./users";

export const groups = pgTable("groups", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }).notNull(),
	createdBy: uuid("created_by").references(() => users.id),
	...defaultColumns,
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type UpdateGroup = Partial<typeof groups.$inferInsert>;
