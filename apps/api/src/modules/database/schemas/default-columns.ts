import { pgEnum, timestamp } from "drizzle-orm/pg-core";

export const registerStatus = pgEnum("status", ["active", "deleted"]);

export const timestampColumns = {
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" })
		.defaultNow()
		.$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
};

export const defaultColumns = {
	status: registerStatus().default("active").notNull(),
	...timestampColumns,
};
