import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { events } from "./events";

export const eventsCategories = pgTable(
	"events_categories",
	{
		eventId: integer("event_id").references(() => events.id),
		categoryId: integer("category_id").references(() => categories.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.eventId, t.categoryId] }),
	}),
);

export type EventCategory = typeof eventsCategories.$inferSelect;
export type NewEventCategory = typeof eventsCategories.$inferInsert;
export type UpdateEventCategory = Partial<typeof eventsCategories.$inferInsert>;
