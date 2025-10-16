import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { users } from "./users";

export const categories = pgTable("categories", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull().unique(),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	...defaultColumns,
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type UpdateCategory = Partial<typeof categories.$inferInsert>;
