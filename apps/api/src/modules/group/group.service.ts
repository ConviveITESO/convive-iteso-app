import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	CreateGroupSchema,
	GroupMessageArraySchema,
	GroupMessageSchema,
	GroupResponseSchema,
} from "@repo/schemas";
import { desc, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { Group, groups, NewGroup, User, users } from "../database/schemas";
import { groupMessages } from "../database/schemas/group-messages";
import { usersGroups } from "../database/schemas/users-groups";
import { UserService } from "../user/user.service";

@Injectable()
export class GroupService {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly userService: UserService,
	) {}

	async createEventGroup(data: CreateGroupSchema): Promise<string> {
		const groupId = await this.createGroup({
			name: data.name,
			description: data.description,
		});
		return groupId;
	}

	async createSubscription(groupId: string, userId: string): Promise<void> {
		await this.db.insert(usersGroups).values({
			groupId,
			userId,
		});
	}

	formatGroup(group: Group, creator?: User): GroupResponseSchema {
		const createdBy = creator ? this.userService.formatUser(creator) : undefined;
		return {
			id: group.id,
			name: group.name,
			description: group.description,
			createdBy,
		};
	}

	private async createGroup(data: NewGroup): Promise<string> {
		const [group] = await this.db.insert(groups).values(data).returning();
		// biome-ignore lint/style/noNonNullAssertion: <>
		return group!.id;
	}

	private formatMessage(message: {
		id: string;
		userId: string;
		content: string;
		createdAt: Date;
		username: string;
		profile: string | null;
	}): GroupMessageSchema {
		return {
			id: message.id,
			userId: message.userId,
			username: message.username || "Unknown User",
			profile: message.profile,
			content: message.content,
			createdAt: message.createdAt,
		};
	}

	async getMessages(groupId: string): Promise<GroupMessageArraySchema> {
		// Validate group exists
		const [group] = await this.db
			.select({ id: groups.id })
			.from(groups)
			.where(eq(groups.id, groupId))
			.limit(1);

		if (!group) {
			throw new NotFoundException(`Group with id ${groupId} not found`);
		}

		const rows = await this.db
			.select({
				id: groupMessages.id,
				userId: groupMessages.userId,
				content: groupMessages.content,
				createdAt: groupMessages.createdAt,
				username: users.name,
				profile: users.profile,
			})
			.from(groupMessages)
			.innerJoin(users, eq(groupMessages.userId, users.id))
			.where(eq(groupMessages.groupId, groupId))
			.orderBy(desc(groupMessages.createdAt));
		return rows.reverse().map(this.formatMessage); // return from oldest to newest
	}

	async sendMessage(groupId: string, userId: string, content: string): Promise<GroupMessageSchema> {
		// Validate group exists
		const [group] = await this.db
			.select({ id: groups.id })
			.from(groups)
			.where(eq(groups.id, groupId))
			.limit(1);

		if (!group) {
			throw new NotFoundException(`Group with id ${groupId} not found`);
		}

		const [row] = await this.db
			.insert(groupMessages)
			.values({ groupId, userId, content })
			.returning();

		if (!row) {
			throw new Error("Failed to send message");
		}

		// Fetch the user name and profile
		const [user] = await this.db
			.select({
				name: users.name,
				profile: users.profile,
			})
			.from(users)
			.where(eq(users.id, userId));

		if (!user) {
			throw new Error("User not found");
		}

		return this.formatMessage({
			id: row.id,
			userId: row.userId,
			content: row.content,
			createdAt: row.createdAt,
			username: user.name,
			profile: user.profile,
		});
	}
}
