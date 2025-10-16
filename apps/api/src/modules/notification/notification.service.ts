import {
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import type { Notification } from "@/modules/database/schemas/notifications";
import { notifications } from "@/modules/database/schemas/notifications";

type ApiNotification = {
	id: string;
	kind: "canceled" | "rescheduled" | "reminder" | "location";
	title: string;
	body: string;
	eventId: number | null;
	userId: number;
	createdAt: string; // ISO
	readAt: string | null; // ISO o null
	meta: {
		originalDate?: string;
		newDate?: string;
		location?: string;
	};
};

@Injectable()
export class NotificationService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async listForUser(userId: number): Promise<ApiNotification[]> {
		const rows = await this.db
			.select()
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.status, "active")))
			.orderBy(desc(notifications.createdAt));

		return rows.map((r) => this.mapRow(r));
	}

	async getById(id: string, userId: number): Promise<ApiNotification> {
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

	async clearAll(userId: number): Promise<void> {
		await this.db.delete(notifications).where(eq(notifications.userId, userId));
	}

	async create(input: typeof notifications.$inferInsert): Promise<ApiNotification> {
		const inserted = await this.db.insert(notifications).values(input).returning();
		const row = inserted[0];
		if (!row) {
			throw new InternalServerErrorException("Failed to insert notification");
		}
		return this.mapRow(row);
	}

	private mapRow(row: Notification): ApiNotification {
		return {
			id: row.id,
			kind: row.kind,
			title: row.title,
			body: row.body,
			eventId: row.eventId,
			userId: row.userId,
			createdAt: row.createdAt?.toISOString?.() ?? (row.createdAt as unknown as string),
			readAt: row.readAt ? (row.readAt.toISOString?.() ?? (row.readAt as unknown as string)) : null,
			meta: {
				originalDate: row.metaOriginalDate ?? undefined,
				newDate: row.metaNewDate ?? undefined,
				location: row.metaLocation ?? undefined,
			},
		};
	}
}
