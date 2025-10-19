import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { ChatService } from "./chat.service";

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	private static readonly FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000001";

	@Get(":eventId")
	async getMessages(@Param("eventId") eventId: string) {
		return await this.chatService.getMessages(eventId);
	}

	@Post(":eventId")
	async sendMessage(
		@Param("eventId") eventId: string,
		@Body("content") content: string,
		@Req() req: Request & { user?: { id?: string } },
	) {
		const userId = typeof req.user?.id === "string" ? req.user.id : ChatController.FALLBACK_USER_ID;
		return await this.chatService.sendMessage(eventId, userId, content);
	}
}
