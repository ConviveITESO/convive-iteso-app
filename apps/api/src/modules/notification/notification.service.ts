import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import type { Notification } from "@/modules/database/schemas/notifications";
import { notifications } from "@/modules/database/schemas/notifications";

@Injectable()
export class NotificationService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async listForUser(userId: number) {
		const rows = await this.db
			.select()
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.status, "active")))
			.orderBy(desc(notifications.createdAt));
		return rows.map(this.mapRow);
	}

	async getById(id: string, userId: number) {
		const [row] = await this.db
			.select()
			.from(notifications)
			.where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
		return row ? this.mapRow(row) : null;
	}

	async clearAll(userId: number) {
		await this.db.delete(notifications).where(eq(notifications.userId, userId));
	}

	async create(input: typeof notifications.$inferInsert) {
		const [row] = await this.db.insert(notifications).values(input).returning();
		return this.mapRow(row);
	}

	private mapRow(row: Notification) {
		return {
			id: row.id,
			kind: row.kind,
			title: row.title,
			body: row.body,
			eventId: row.eventId,
			userId: row.userId,
			createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
			readAt: row.readAt ? (row.readAt.toISOString?.() ?? row.readAt) : null,
			meta: {
				originalDate: row.metaOriginalDate ?? undefined,
				newDate: row.metaNewDate ?? undefined,
				location: row.metaLocation ?? undefined,
			},
		};
	}
}
