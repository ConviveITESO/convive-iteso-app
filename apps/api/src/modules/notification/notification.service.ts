import {
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common";
import { CreateNotificationTestSchema, NotificationResponse } from "@repo/schemas";
import { and, desc, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import type { NewNotification, Notification } from "@/modules/database/schemas/notifications";
import { notifications } from "@/modules/database/schemas/notifications";

@Injectable()
export class NotificationService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async listForUser(userId: string): Promise<NotificationResponse[]> {
		const rows = await this.db
			.select()
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.status, "active")))
			.orderBy(desc(notifications.createdAt));

		return rows.map((r) => this.mapRow(r));
	}

	async getById(id: string, userId: string): Promise<NotificationResponse> {
		const [row] = await this.db
			.select()
			.from(notifications)
			.where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
			.limit(1);

		if (!row) {
			throw new NotFoundException("Notification not found");
		}

		return this.mapRow(row);
	}

	async clearAll(userId: string): Promise<void> {
		await this.db.delete(notifications).where(eq(notifications.userId, userId));
	}

	async create(input: CreateNotificationTestSchema, userId: string): Promise<NotificationResponse> {
		const data: NewNotification = {
			userId,
			eventId: input.eventId,
			kind: input.kind,
			title: input.title,
			body: input.body,
			metaOriginalDate: input.meta?.originalDate,
			metaNewDate: input.meta?.newDate,
			metaLocation: input.meta?.location,
		};
		const inserted = await this.db.insert(notifications).values(data).returning();
		const row = inserted[0];
		if (!row) {
			throw new InternalServerErrorException("Failed to insert notification");
		}
		return this.mapRow(row);
	}

	private mapRow(row: Notification): NotificationResponse {
		return {
			id: row.id,
			kind: row.kind,
			title: row.title,
			body: row.body,
			eventId: row.eventId,
			userId: row.userId,
			createdAt: row.createdAt,
			readAt: row.readAt ?? undefined,
			meta: {
				originalDate: row.metaOriginalDate ?? undefined,
				newDate: row.metaNewDate ?? undefined,
				location: row.metaLocation ?? undefined,
			},
		};
	}
}
