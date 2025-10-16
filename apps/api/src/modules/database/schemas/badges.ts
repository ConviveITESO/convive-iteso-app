import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { users } from "./users";

export const badges = pgTable("badges", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }).notNull(),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	...defaultColumns,
});

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UpdateBadge = Partial<typeof badges.$inferInsert>;
