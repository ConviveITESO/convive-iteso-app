import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { defaultColumns } from "./default-columns";
import { groups } from "./groups";
import { locations } from "./locations";
import { users } from "./users";

export const events = pgTable("events", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }).notNull(),
	startDate: timestamp("start_date", { mode: "date" }).notNull(),
	endDate: timestamp("end_date", { mode: "date" }).notNull(),
	quota: integer("quota").notNull(),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	locationId: uuid("location_id")
		.notNull()
		.references(() => locations.id),
	groupId: uuid("group_id")
		.notNull()
		.references(() => groups.id),
	...defaultColumns,
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type UpdateEvent = Partial<typeof events.$inferInsert>;
