import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { groups } from "./groups";
import { users } from "./users";

export const usersGroups = pgTable(
	"users_groups",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		groupId: uuid("group_id")
			.notNull()
			.references(() => groups.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.groupId] }),
	}),
);

export type UserGroup = typeof usersGroups.$inferSelect;
export type NewUserGroup = typeof usersGroups.$inferInsert;
export type UpdateUserGroup = Partial<typeof usersGroups.$inferInsert>;
