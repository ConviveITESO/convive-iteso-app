import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestampColumns } from "./default-columns";

export const userStatus = pgEnum("status", ["new", "active", "deleted"]);

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 256 }).notNull().unique(),
	firstName: varchar("first_name", { length: 256 }).notNull(),
	lastName: varchar("last_name", { length: 256 }).notNull(),
	status: userStatus().default("new").notNull(),
	...timestampColumns,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<typeof users.$inferInsert>;
