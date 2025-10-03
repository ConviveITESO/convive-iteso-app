import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/modules/database/schemas",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noProcessEnv: false positive
		url: process.env.DATABASE_URL || "",
	},
});
