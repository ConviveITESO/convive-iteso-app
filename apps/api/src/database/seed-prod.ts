import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppDatabase } from "@/modules/database/connection";
import * as schemas from "../modules/database/schemas";

/**
 * Production seed script
 * Seeds only essential data: locations and categories
 * Does not delete existing data
 */

const PRODUCTION_CATEGORIES = [
	"Art",
	"Culture",
	"Sports",
	"Entertainment",
	"Science",
	"Technology",
	"Health",
	"Business",
	"Environment",
	"Social",
	"Education",
	"Community Service",
	"Workshops",
	"Conferences",
	"Networking",
	"Music",
	"Theater",
	"Film",
	"Literature",
	"Philosophy",
];

const PRODUCTION_LOCATIONS = [
	"Building A",
	"Building B",
	"Building C",
	"Building D",
	"Building E",
	"Building F",
	"Building G",
	"Building H",
	"Building I",
	"Building J",
	"Building K",
	"Building L",
	"Building M",
	"Building N",
	"Building P",
	"Building T",
	"Building V",
	"Library",
	"Arrupe Auditorium",
	"Auditorium D1",
	"Pedro Arrupe Cultural Center",
	"Sports Complex",
	"Student Center",
	"Chapel",
	"Cafeteria",
	"Main Plaza",
	"Central Garden",
];

async function getOrCreateAdminUser(db: AppDatabase): Promise<string> {
	// Try to find an existing admin user (you can customize the email)
	const adminEmail = "admin@iteso.mx";

	let admin = await db.query.users.findFirst({
		where: and(eq(schemas.users.email, adminEmail), eq(schemas.users.status, "active")),
	});

	if (!admin) {
		// biome-ignore lint/suspicious/noConsole: seeding script
		console.log(`Creating admin user: ${adminEmail}`);
		const [result] = await db
			.insert(schemas.users)
			.values({
				email: adminEmail,
				name: "System Admin",
				status: "active",
			})
			.returning();
		if (!result) {
			throw new Error("Failed to create admin user");
		}
		admin = result;
	}

	if (!admin) {
		throw new Error("Failed to get or create admin user");
	}

	return admin.id;
}

async function seedCategories(db: AppDatabase, adminUserId: string): Promise<void> {
	// biome-ignore lint/suspicious/noConsole: seeding script
	console.log("Seeding categories...");

	let inserted = 0;
	let skipped = 0;

	for (const categoryName of PRODUCTION_CATEGORIES) {
		// Check if category already exists (case-insensitive)
		const existing = await db.query.categories.findFirst({
			where: and(
				eq(schemas.categories.name, categoryName.toLowerCase()),
				eq(schemas.categories.status, "active"),
			),
		});

		if (existing) {
			skipped++;
			continue;
		}

		await db.insert(schemas.categories).values({
			name: categoryName.toLowerCase(),
			createdBy: adminUserId,
			status: "active",
		});
		inserted++;
	}

	// biome-ignore lint/suspicious/noConsole: seeding script
	console.log(`Categories: ${inserted} inserted, ${skipped} skipped (already exist)`);
}

async function seedLocations(db: AppDatabase, adminUserId: string): Promise<void> {
	// biome-ignore lint/suspicious/noConsole: seeding script
	console.log("Seeding locations...");

	let inserted = 0;
	let skipped = 0;

	for (const locationName of PRODUCTION_LOCATIONS) {
		// Check if location already exists
		const existing = await db.query.locations.findFirst({
			where: and(eq(schemas.locations.name, locationName), eq(schemas.locations.status, "active")),
		});

		if (existing) {
			skipped++;
			continue;
		}

		await db.insert(schemas.locations).values({
			name: locationName,
			createdBy: adminUserId,
			status: "active",
		});
		inserted++;
	}

	// biome-ignore lint/suspicious/noConsole: seeding script
	console.log(`Locations: ${inserted} inserted, ${skipped} skipped (already exist)`);
}

async function main() {
	// biome-ignore lint/suspicious/noConsole: seeding script
	console.log("Starting production seeding...");
	// biome-ignore lint/suspicious/noConsole: seeding script
	console.log("This will NOT delete existing data");

	// biome-ignore lint/style/noProcessEnv: seeding script
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const db = drizzle(pool, { schema: schemas });

	try {
		// Get or create admin user
		const adminUserId = await getOrCreateAdminUser(db);

		// Seed essential data
		await seedCategories(db, adminUserId);
		await seedLocations(db, adminUserId);

		// biome-ignore lint/suspicious/noConsole: seeding script
		console.log("\n✅ Production seeding completed successfully!");
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: seeding script
		console.error("❌ Error during seeding:", error);
		throw error;
	} finally {
		await pool.end();
	}
}

config();
main().catch((error) => {
	// biome-ignore lint/suspicious/noConsole: seeding script
	console.error(error);
	process.exit(1);
});
