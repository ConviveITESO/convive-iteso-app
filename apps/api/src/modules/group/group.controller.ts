import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRequest } from "@/types/user.request";
import { UserStatusGuard } from "../auth/guards/user.status.guard";
import { GroupService } from "./group.service";

@ApiTags("Groups")
@Controller("groups")
@UseGuards(UserStatusGuard)
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Get(":groupId/messages")
	async getMessages(@Param("groupId") groupId: string) {
		Logger.debug(`Getting messages for group ${groupId}`);
		return await this.groupService.getMessages(groupId);
	}

	@Post(":groupId/messages")
	async sendMessage(
		@Param("groupId") groupId: string,
		@Body("content") content: string,
		@Req() req: UserRequest,
	) {
		return await this.groupService.sendMessage(groupId, req.user.id, content);
	}
}
