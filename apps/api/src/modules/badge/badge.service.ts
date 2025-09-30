import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BadgeResponseSchema } from "@repo/schemas";
import { and, count, eq, inArray } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { Badge, badges } from "../database/schemas";

@Injectable()
export class BadgeService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async assertBadgesExist(ids: string[]): Promise<void> {
		const result = await this.db
			.select({ count: count() })
			.from(badges)
			.where(and(inArray(badges.id, ids), eq(badges.status, "active")));
		// biome-ignore lint/style/noNonNullAssertion: <>
		const badgesCount = result[0]!.count;
		if (ids.length !== badgesCount) throw new NotFoundException("Badge not found");
	}

	formatBadge(badge: Badge): BadgeResponseSchema {
		return {
			id: badge.id,
			name: badge.name,
			description: badge.description,
		};
	}
}
