import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import { chatMessages } from "@/modules/database/schemas/chat-messages";

@Injectable()
export class ChatService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async getMessages(eventId: string) {
		const rows = await this.db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.eventId, eventId))
			.orderBy(desc(chatMessages.createdAt));
		return rows.reverse(); // para devolverlos de viejo a nuevo
	}

	async sendMessage(eventId: string, userId: string, content: string) {
		const [row] = await this.db
			.insert(chatMessages)
			.values({ eventId, userId, content })
			.returning();
		return row;
	}
}
