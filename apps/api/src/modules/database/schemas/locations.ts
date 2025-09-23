import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";

export const locations = pgTable("locations", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull().unique(),
	...defaultColumns,
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type UpdateLocation = Partial<typeof locations.$inferInsert>;
