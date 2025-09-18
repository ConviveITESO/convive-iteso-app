import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";

export const categories = pgTable("categories", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 256 }).notNull().unique(),
	...defaultColumns,
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type UpdateCategory = Partial<typeof categories.$inferInsert>;
