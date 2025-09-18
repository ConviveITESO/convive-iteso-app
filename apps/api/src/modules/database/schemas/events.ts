import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { groups } from "./groups";
import { locations } from "./locations";
import { users } from "./users";

export const events = pgTable("events", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }).notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date").notNull(),
	quota: integer("quota").notNull(),
	createdBy: integer("created_by")
		.notNull()
		.references(() => users.id),
	locationId: integer("location_id")
		.notNull()
		.references(() => locations.id),
	groupId: integer("group_id")
		.notNull()
		.references(() => groups.id),
	...defaultColumns,
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type UpdateEvent = Partial<typeof events.$inferInsert>;
