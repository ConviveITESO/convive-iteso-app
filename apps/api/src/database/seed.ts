import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppDatabase } from "@/modules/database/connection";
import * as schemas from "../modules/database/schemas";

type NewComment = typeof schemas.comments.$inferInsert;
type NewRating = typeof schemas.ratings.$inferInsert;

type SeedEventsResult = {
	eventIds: string[];
	fullEventId?: string;
	almostFullEventId?: string;
	spaciousEventId?: string;
};

type SpecialEventConfig = {
	fullEventId?: string;
	almostFullEventId?: string;
	spaciousEventId?: string;
	fullEventExcludedUserIds?: string[];
};

const COMMENT_TEXT_SAMPLES = [
	"Loved the energy around this activity.",
	"Great content, thanks for organizing!",
	"Would appreciate a longer Q&A next time.",
	"It was great connecting with other classmates.",
	"The speaker made everything very clear.",
	"Venue felt a little cramped but still fun overall.",
	"Perfect timing before finals season.",
	"Looking forward to the next session already!",
];

function generateSeedUserEmails(count: number): string[] {
	return Array.from({ length: count }, (_, index) => `user${index}@iteso.mx`);
}

function getRandomNumber(min: number, max: number): number {
	return Math.floor(min + Math.random() * (max - min + 1));
}

function selectRandomFromArray<T>(array: T[]): T {
	const randomIndex = getRandomNumber(0, array.length - 1);
	return array[randomIndex] as T;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
	const start = startDate.getTime();
	const end = endDate.getTime();
	const randomTime = getRandomNumber(start, end);
	return new Date(randomTime);
}

function getRandomItems(array: string[]): string[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = getRandomNumber(0, i);
		const temp = shuffled[i];
		const swapValue = shuffled[j];
		if (temp !== undefined && swapValue !== undefined) {
			shuffled[i] = swapValue;
			shuffled[j] = temp;
		}
	}
	const n = getRandomNumber(1, array.length - 1);
	return shuffled.slice(0, n);
}

function getShuffledArray<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = getRandomNumber(0, i);
		const temp = copy[i];
		const swapValue = copy[j];
		if (temp !== undefined && swapValue !== undefined) {
			copy[i] = swapValue;
			copy[j] = temp;
		}
	}
	return copy;
}

async function resetDatabase(db: AppDatabase, seedUserEmails: string[]): Promise<void> {
	await db.delete(schemas.eventsCategories);
	await db.delete(schemas.eventsBadges);
	await db.delete(schemas.usersGroups);
	await db.delete(schemas.subscriptions);
	await db.delete(schemas.comments);
	await db.delete(schemas.ratings);
	await db.delete(schemas.reminders);
	await db.delete(schemas.events);
	await db.delete(schemas.groups);
	await db.delete(schemas.locations);
	await db.delete(schemas.categories);
	await db.delete(schemas.badges);
	if (seedUserEmails.length > 0) {
		await db.delete(schemas.users).where(inArray(schemas.users.email, seedUserEmails));
	}
}

async function seedUsers(db: AppDatabase, count: number): Promise<string[]> {
	for (let i = 0; i < count; i++) {
		await db.insert(schemas.users).values({
			email: `user${i}@iteso.mx`,
			name: `User${i} Name`,
			status: selectRandomFromArray(["active", "deleted"]),
		});
	}
	return (
		await db.query.users.findMany({
			where: eq(schemas.users.status, "active"),
		})
	).map((register) => register.id);
}

async function seedBadges(db: AppDatabase, count: number, userIds: string[]): Promise<string[]> {
	for (let i = 0; i < count; i++) {
		await db.insert(schemas.badges).values({
			name: `Badge${i}`,
			description: `This is the badge${i}`,
			createdBy: selectRandomFromArray(userIds),
			status: selectRandomFromArray(["active", "deleted"]),
		});
	}
	return (
		await db.query.badges.findMany({
			where: eq(schemas.badges.status, "active"),
		})
	).map((register) => register.id);
}

async function seedCategories(db: AppDatabase, userIds: string[]): Promise<string[]> {
	const names = [
		"art",
		"culture",
		"sports",
		"entertainment",
		"science",
		"technology",
		"health",
		"business",
		"environment",
		"economy",
		"math",
	];
	await db.insert(schemas.categories).values(
		names.map((name) => ({
			name,
			createdBy: selectRandomFromArray(userIds),
			status: selectRandomFromArray(["active", "deleted"] as const),
		})),
	);
	return (
		await db.query.categories.findMany({
			where: eq(schemas.categories.status, "active"),
		})
	).map((register) => register.id);
}

async function seedLocations(db: AppDatabase, userIds: string[]): Promise<string[]> {
	const names = [
		"Building A",
		"Building B",
		"Building C",
		"Building D",
		"Building M",
		"Building T",
		"Library",
		"Arrupe Auditorium",
		"Auditorium D1",
	];
	await db.insert(schemas.locations).values(
		names.map((name) => ({
			name,
			createdBy: selectRandomFromArray(userIds),
			status: selectRandomFromArray(["active", "deleted"] as const),
		})),
	);
	return (
		await db.query.locations.findMany({
			where: eq(schemas.locations.status, "active"),
		})
	).map((register) => register.id);
}

async function seedEvents(
	db: AppDatabase,
	count: number,
	userIds: string[],
	badgeIds: string[],
	categoryIds: string[],
	locationIds: string[],
): Promise<SeedEventsResult> {
	const now = new Date();
	const futureEventsCount = Math.min(3, count);
	const millisecondsInDay = 24 * 60 * 60 * 1000;
	let fullEventId: string | undefined;
	let almostFullEventId: string | undefined;
	let spaciousEventId: string | undefined;
	for (let i = 0; i < count; i++) {
		const groupResult = await db
			.insert(schemas.groups)
			.values({
				name: `Group for Event${i}`,
				description: `This is a description for Event${i}'s group`,
			})
			.returning({
				id: schemas.groups.id,
			});
		const groupId = groupResult[0]?.id;
		if (!groupId) {
			continue;
		}
		const userId = selectRandomFromArray(userIds);
		await db.insert(schemas.usersGroups).values({
			userId,
			groupId,
		});
		const initialDate = new Date("2025-01-01T00:00:00.000Z");
		let startDate: Date;
		let endDate: Date;
		if (i < futureEventsCount) {
			const futureOffsetDays = getRandomNumber(1, 60);
			startDate = new Date(now.getTime() + futureOffsetDays * millisecondsInDay);
			if (selectRandomFromArray([true, false])) {
				const durationDays = getRandomNumber(0, 10);
				endDate = new Date(startDate.getTime() + durationDays * millisecondsInDay);
			} else {
				endDate = startDate;
			}
		} else {
			startDate = getRandomDate(initialDate, now);
			endDate = selectRandomFromArray([true, false]) ? getRandomDate(startDate, now) : startDate;
		}
		let quota = getRandomNumber(1, 100);
		let status: "active" | "deleted" = selectRandomFromArray(["active", "deleted"]);
		if (i === 0) {
			quota = Math.max(1, Math.min(userIds.length, 10));
			status = "active";
		} else if (i === 1) {
			quota = Math.max(2, Math.min(userIds.length, 12));
			status = "active";
		} else if (i === 2) {
			quota = Math.max(10, Math.min(userIds.length, 40));
			status = "active";
		}
		const eventResult = await db
			.insert(schemas.events)
			.values({
				name: `Event${i}`,
				description: `This is a description for Event${i}`,
				startDate,
				endDate,
				quota: quota,
				imageUrl: `https://picsum.photos/seed/event${i}/400/300`,
				createdBy: userId,
				groupId,
				locationId: selectRandomFromArray(locationIds),
				status,
			})
			.returning({
				id: schemas.events.id,
			});
		const eventId = eventResult[0]?.id;
		if (!eventId) {
			continue;
		}
		if (i === 0) {
			fullEventId = eventId;
		} else if (i === 1) {
			almostFullEventId = eventId;
		} else if (i === 2) {
			spaciousEventId = eventId;
		}
		const badgeIdsToInsert = getRandomItems(badgeIds);
		const categoryIdsToInsert = getRandomItems(categoryIds);
		await db.insert(schemas.eventsBadges).values(
			badgeIdsToInsert.map((badgeId) => ({
				eventId,
				badgeId,
			})),
		);
		await db.insert(schemas.eventsCategories).values(
			categoryIdsToInsert.map((categoryId) => ({
				eventId,
				categoryId,
			})),
		);
	}
	const activeEvents = await db.query.events.findMany({
		where: eq(schemas.events.status, "active"),
	});
	return {
		eventIds: activeEvents.map((register) => register.id),
		fullEventId,
		almostFullEventId,
		spaciousEventId,
	};
}

async function seedSubscriptions(
	db: AppDatabase,
	userIds: string[],
	eventIds: string[],
	specialEvents?: SpecialEventConfig,
): Promise<void> {
	if (userIds.length === 0 || eventIds.length === 0) {
		return;
	}
	const events = await db.query.events.findMany({
		where: inArray(schemas.events.id, eventIds),
		columns: {
			id: true,
			quota: true,
		},
	});
	for (const event of events) {
		let candidateUsers = [...userIds];
		if (
			specialEvents?.fullEventId === event.id &&
			specialEvents.fullEventExcludedUserIds &&
			specialEvents.fullEventExcludedUserIds.length > 0
		) {
			const exclusions = new Set(specialEvents.fullEventExcludedUserIds);
			candidateUsers = candidateUsers.filter((userId) => !exclusions.has(userId));
		}
		const shuffledUsers = [...candidateUsers];
		for (let i = shuffledUsers.length - 1; i > 0; i--) {
			const j = getRandomNumber(0, i);
			const temp = shuffledUsers[i];
			const swapValue = shuffledUsers[j];
			if (temp !== undefined && swapValue !== undefined) {
				shuffledUsers[i] = swapValue;
				shuffledUsers[j] = temp;
			}
		}
		const maxRegistrations = Math.min(event.quota ?? 0, shuffledUsers.length);
		if (maxRegistrations === 0) {
			continue;
		}
		let registeredCount: number;
		let waitlistedCount: number;
		if (specialEvents?.fullEventId === event.id) {
			registeredCount = maxRegistrations;
			waitlistedCount = 0;
		} else if (specialEvents?.almostFullEventId === event.id) {
			registeredCount = Math.min(Math.max((event.quota ?? 0) - 1, 1), maxRegistrations);
			waitlistedCount = 0;
		} else if (specialEvents?.spaciousEventId === event.id) {
			const desired = Math.max(1, Math.floor((event.quota ?? 0) * 0.25));
			registeredCount = Math.min(desired, maxRegistrations);
			waitlistedCount = 0;
		} else {
			registeredCount = getRandomNumber(1, maxRegistrations);
			const remainingUsers = shuffledUsers.slice(registeredCount);
			waitlistedCount =
				remainingUsers.length === 0 ? 0 : getRandomNumber(0, Math.min(5, remainingUsers.length));
		}
		const remainingUsers = shuffledUsers.slice(registeredCount);
		const subscriptionsToInsert: schemas.NewSubscription[] = [];
		for (let index = 0; index < registeredCount; index++) {
			const userId = shuffledUsers[index];
			if (!userId) {
				continue;
			}
			subscriptionsToInsert.push({
				userId,
				eventId: event.id,
				status: "registered",
				position: index + 1,
			});
		}
		for (let index = 0; index < waitlistedCount; index++) {
			const userId = remainingUsers[index];
			if (!userId) {
				continue;
			}
			subscriptionsToInsert.push({
				userId,
				eventId: event.id,
				status: "waitlisted",
				position: registeredCount + index + 1,
			});
		}
		if (subscriptionsToInsert.length > 0) {
			await db.insert(schemas.subscriptions).values(subscriptionsToInsert);
		}
	}
}

async function seedComments(db: AppDatabase, userIds: string[], eventIds: string[]): Promise<void> {
	if (userIds.length === 0 || eventIds.length === 0) {
		return;
	}
	const commentsToInsert: NewComment[] = [];
	for (const eventId of eventIds) {
		const commentCount = getRandomNumber(0, Math.min(6, userIds.length));
		if (commentCount === 0) {
			continue;
		}
		const shuffledUsers = getShuffledArray(userIds);
		for (let index = 0; index < commentCount; index++) {
			const userId = shuffledUsers[index];
			if (!userId) {
				continue;
			}
			commentsToInsert.push({
				userId,
				eventId,
				commentText: selectRandomFromArray(COMMENT_TEXT_SAMPLES),
			});
		}
	}
	if (commentsToInsert.length > 0) {
		await db.insert(schemas.comments).values(commentsToInsert);
	}
}

async function seedRatings(db: AppDatabase, userIds: string[], eventIds: string[]): Promise<void> {
	if (userIds.length === 0 || eventIds.length === 0) {
		return;
	}
	const events = await db.query.events.findMany({
		where: inArray(schemas.events.id, eventIds),
		columns: {
			id: true,
			endDate: true,
		},
	});
	const now = Date.now();
	const finishedEvents = events.filter((event) => event.endDate && event.endDate.getTime() <= now);
	if (finishedEvents.length === 0) {
		return;
	}
	const ratingsToInsert: NewRating[] = [];
	for (const event of finishedEvents) {
		const maxRatingsPerEvent = Math.min(6, userIds.length);
		const ratingCount = getRandomNumber(1, maxRatingsPerEvent);
		const shuffledUsers = getShuffledArray(userIds);
		for (let index = 0; index < ratingCount; index++) {
			const userId = shuffledUsers[index];
			if (!userId) {
				continue;
			}
			ratingsToInsert.push({
				userId,
				eventId: event.id,
				score: getRandomNumber(3, 5),
			});
		}
	}
	if (ratingsToInsert.length > 0) {
		await db.insert(schemas.ratings).values(ratingsToInsert);
	}
}

async function main() {
	// biome-ignore lint/style/noProcessEnv: false positive
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const db = drizzle(pool, { schema: schemas });
	const seedUserCount = 20;
	const seedUserEmails = [...generateSeedUserEmails(seedUserCount), "admin@iteso.mx"];
	await resetDatabase(db, seedUserEmails);
	const preservedActiveUsers = await db.query.users.findMany({
		where: eq(schemas.users.status, "active"),
	});
	const preservedActiveUserIds = preservedActiveUsers.map((user) => user.id);
	// TODO: Remove once role management is implemented
	await db.insert(schemas.users).values({
		email: `admin@iteso.mx`,
		name: `ADMIN`,
		status: "active",
	});
	const userIds = await seedUsers(db, seedUserCount);
	const badgeIds = await seedBadges(db, 10, userIds);
	const categoryIds = await seedCategories(db, userIds);
	const locationIds = await seedLocations(db, userIds);

	const { eventIds, fullEventId, almostFullEventId, spaciousEventId } = await seedEvents(
		db,
		20,
		userIds,
		badgeIds,
		categoryIds,
		locationIds,
	);
	await seedSubscriptions(db, userIds, eventIds, {
		fullEventId,
		almostFullEventId,
		spaciousEventId,
		fullEventExcludedUserIds: preservedActiveUserIds,
	});
	await seedComments(db, userIds, eventIds);
	await seedRatings(db, userIds, eventIds);
	await pool.end();
}

config();
main().catch((error) => {
	// biome-ignore lint/suspicious/noConsole: false positive
	console.error(error);
	process.exit(1);
});
