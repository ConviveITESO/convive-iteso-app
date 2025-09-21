import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { events } from "./events";

export const eventsCategories = pgTable(
	"events_categories",
	{
		eventId: uuid("event_id").references(() => events.id),
		categoryId: uuid("category_id").references(() => categories.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.eventId, t.categoryId] }),
	}),
);

export type EventCategory = typeof eventsCategories.$inferSelect;
export type NewEventCategory = typeof eventsCategories.$inferInsert;
export type UpdateEventCategory = Partial<typeof eventsCategories.$inferInsert>;
