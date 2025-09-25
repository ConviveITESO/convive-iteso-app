import { Inject, Injectable } from "@nestjs/common";
import { CreateGroupSchema, GroupResponseSchema } from "@repo/schemas";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { Group, groups, NewGroup, User } from "../database/schemas";
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
}
