import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";

export const badges = pgTable("badges", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull().unique(),
	description: varchar("description", { length: 1024 }).notNull(),
	...defaultColumns,
});

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UpdateBadge = Partial<typeof badges.$inferInsert>;
