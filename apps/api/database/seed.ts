import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppDatabase } from "@/modules/database/connection";
import * as schemas from "../src/modules/database/schemas";

function selectRandomFromArray<T>(array: T[]): T {
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex] as T;
}

async function resetDatabase(db: AppDatabase): Promise<void> {
	await db.delete(schemas.eventsCategories);
	await db.delete(schemas.eventsBadges);
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
			status: selectRandomFromArray(["active", "deleted"]) as UserStatus,
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
			status: selectRandomFromArray(["active", "deleted"]) as RegisterStatus,
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
			status: selectRandomFromArray(["active", "deleted"]) as RegisterStatus,
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
	await db.delete(schemas.events);
	await db.delete(schemas.locations);
	await db.insert(schemas.locations).values(
		names.map((name) => ({
			name,
			createdBy: selectRandomFromArray(userIds),
			status: selectRandomFromArray(["active", "deleted"]) as RegisterStatus,
		})),
	);
	return (
		await db.query.locations.findMany({
			where: eq(schemas.locations.status, "active"),
		})
	).map((register) => register.id);
}

async function main() {
	// biome-ignore lint/correctness/noProcessGlobal: <>
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const db = drizzle(pool, { schema: schemas });
	await resetDatabase(db);
	const userIds = await seedUsers(db, 20);
	await seedBadges(db, 10, userIds);
	await seedCategories(db, userIds);
	await seedLocations(db, userIds);
	await pool.end();
}

type UserStatus = "active" | "deleted";

type RegisterStatus = "active" | "deleted";

config();
// biome-ignore lint/nursery/noFloatingPromises: <>
main();
