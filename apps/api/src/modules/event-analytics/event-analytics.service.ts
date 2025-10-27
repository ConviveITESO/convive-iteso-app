// apps/api/src/modules/events-analytics/events-analytics.service.ts
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq, sql } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { events, subscriptions, users } from "../database/schemas";

export type ParticipantsRow = {
	userId: string;
	userName: string;
	subscriptionStatus: "registered" | "waitlisted" | "cancelled" | "attended";
	eventQuota: number;
};

export type ChartSlice = {
	name: "registered" | "waitlisted" | "cancelled" | "attended" | "quota";
	count: number;
};

@Injectable()
export class EventAnalyticsService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * GET 1: Participantes inscritos con estatus + cuota del evento.
	 * Devuelve: [{ userId, userName, subscriptionStatus, eventQuota }, ...]
	 */
	async getParticipants(eventId: string): Promise<ParticipantsRow[]> {
		const event = await this.db
			.select({ id: events.id, quota: events.quota })
			.from(events)
			.where(eq(events.id, eventId))
			.limit(1);
		if (event.length === 0) throw new NotFoundException("Event not found");

		const rows = await this.db
			.select({
				userId: subscriptions.userId,
				userName: users.name,
				subscriptionStatus: subscriptions.status,
				eventQuota: events.quota,
			})
			.from(subscriptions)
			.innerJoin(users, eq(users.id, subscriptions.userId))
			.innerJoin(events, eq(events.id, subscriptions.eventId))
			.where(eq(subscriptions.eventId, eventId))
			.orderBy(asc(subscriptions.status));

		// rows ya es ParticipantsRow[]
		return rows;
	}

	async getChart(eventId: string): Promise<ChartSlice[]> {
		// 1) evento + quota
		const [eventRow] = await this.db
			.select({ id: events.id, quota: events.quota })
			.from(events)
			.where(eq(events.id, eventId))
			.limit(1);
		if (!eventRow) throw new NotFoundException("Event not found");

		// 2) conteo por estatus
		const statusRows = await this.db.execute(sql<{ status: string; count: number }>`
      SELECT s.status, COUNT(*)::int AS count
      FROM ${subscriptions} s
      WHERE s.event_id = ${eventId}
      GROUP BY s.status;
    `);

		const counts = {
			registered: 0,
			waitlisted: 0,
			cancelled: 0,
			attended: 0,
		};
		for (const r of statusRows.rows) {
			const s = r.status as string;
			if (s in counts) {
				counts[s] = r.count;
			}
		}

		// 3) total de suscripciones (todas)
		const totalSubsRes = await this.db.execute(sql<{ total: number }>`
      SELECT COUNT(*)::int AS total
      FROM ${subscriptions}
      WHERE ${subscriptions.eventId} = ${eventId};
    `);
		const totalSubscriptions = totalSubsRes.rows[0]?.total ?? 0;

		// 4) quota = event.quota - totalSubscriptions (lo que pediste)
		const quotaSlice = Math.max(eventRow.quota - Number(totalSubscriptions), 0);

		// 5) respuesta minimal para la gráfica
		const result: ChartSlice[] = [
			{ name: "registered", count: counts.registered },
			{ name: "cancelled", count: counts.cancelled },
			{ name: "waitlisted", count: counts.waitlisted },
			{ name: "attended", count: counts.attended },
			{ name: "quota", count: quotaSlice },
		];

		return result;
	}
}
