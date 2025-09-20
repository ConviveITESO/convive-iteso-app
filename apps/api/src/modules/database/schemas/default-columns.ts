import { pgEnum, timestamp } from "drizzle-orm/pg-core";

export const registerStatus = pgEnum("status", ["active", "deleted"]);

export const timestampColumns = {
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
	deletedAt: timestamp("deleted_at"),
};

export const defaultColumns = {
	status: registerStatus().default("active").notNull(),
	...timestampColumns,
};
