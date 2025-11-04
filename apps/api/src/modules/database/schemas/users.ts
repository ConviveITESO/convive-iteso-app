import { pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { timestampColumns } from "./default-columns";

export const userStatus = pgEnum("user_status", ["active", "deleted"]);

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	email: varchar("email", { length: 256 }).notNull().unique(),
	name: varchar("name", { length: 256 }).notNull(),
	role: varchar("role", { length: 50 }).notNull().default("student"),
	profile: varchar("image_url", { length: 1024 }),
	status: userStatus().default("active").notNull(),
	...timestampColumns,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<typeof users.$inferInsert>;
