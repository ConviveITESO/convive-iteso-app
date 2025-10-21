import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppDatabase } from "@/modules/database/connection";
import * as schemas from "../modules/database/schemas";

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

async function resetDatabase(db: AppDatabase): Promise<void> {
	await db.delete(schemas.eventsCategories);
	await db.delete(schemas.eventsBadges);
	await db.delete(schemas.usersGroups);
	await db.delete(schemas.subscriptions);
	await db.delete(schemas.reminders);
	await db.delete(schemas.events);
	await db.delete(schemas.groups);
	await db.delete(schemas.locations);
	await db.delete(schemas.categories);
	await db.delete(schemas.badges);
	await db.delete(schemas.users);
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
): Promise<string[]> {
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
		const startDate = getRandomDate(initialDate, new Date());
		const endDate = selectRandomFromArray([true, false])
			? getRandomDate(startDate, new Date())
			: startDate;
		const eventResult = await db
			.insert(schemas.events)
			.values({
				name: `Event${i}`,
				description: `This is a description for Event${i}`,
				startDate,
				endDate,
				quota: getRandomNumber(1, 100),
				imageUrl: `https://via.placeholder.com/400x300?text=Event${i}`,
				createdBy: userId,
				groupId,
				locationId: selectRandomFromArray(locationIds),
				status: selectRandomFromArray(["active", "deleted"]),
			})
			.returning({
				id: schemas.events.id,
			});
		const eventId = eventResult[0]?.id;
		if (!eventId) {
			continue;
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
	return (
		await db.query.events.findMany({
			where: eq(schemas.events.status, "active"),
		})
	).map((register) => register.id);
}

async function seedSubscriptions(
	db: AppDatabase,
	userIds: string[],
	eventIds: string[],
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
		const shuffledUsers = [...userIds];
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
		const registeredCount = getRandomNumber(1, maxRegistrations);
		const remainingUsers = shuffledUsers.slice(registeredCount);
		const waitlistedCount =
			remainingUsers.length === 0 ? 0 : getRandomNumber(0, Math.min(5, remainingUsers.length));
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

async function main() {
	// biome-ignore lint/style/noProcessEnv: false positive
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const db = drizzle(pool, { schema: schemas });
	await resetDatabase(db);
	// TODO: Remove once role management is implemented
	await db.insert(schemas.users).values({
		email: `admin@iteso.mx`,
		name: `ADMIN`,
		status: "active",
	});
	const userIds = await seedUsers(db, 20);
	const badgeIds = await seedBadges(db, 10, userIds);
	const categoryIds = await seedCategories(db, userIds);
	const locationIds = await seedLocations(db, userIds);
	const eventIds = await seedEvents(db, 20, userIds, badgeIds, categoryIds, locationIds);
	await seedSubscriptions(db, userIds, eventIds);
	await pool.end();
}

config();
main().catch((error) => {
	// biome-ignore lint/suspicious/noConsole: false positive
	console.error(error);
	process.exit(1);
});
