import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { users } from "./users";

export const locations = pgTable("locations", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull().unique(),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	...defaultColumns,
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type UpdateLocation = Partial<typeof locations.$inferInsert>;
