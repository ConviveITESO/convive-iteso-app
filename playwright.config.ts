import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { defineBddConfig } from "playwright-bdd";

// Load test environment variables
dotenv.config({ path: ".env.test" });

const testDir = defineBddConfig({
	features: "apps/web/test/e2e/features/**/*.feature",
	steps: "apps/web/test/e2e/steps/**/*.steps.ts",
	outputDir: "apps/web/test/.e2e-results",
});

export default defineConfig({
	testDir,
	timeout: 30_000,
	expect: {
		timeout: 10_000,
	},

	fullyParallel: true,

	forbidOnly: false,
	retries: 0,
	workers: undefined,

	reporter: [["list"], ["html", { open: "never" }]],

	use: {
		headless: true,
		// biome-ignore lint/style/useNamingConvention: Playwright uses baseURL casing
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		video: "retain-on-failure",
		screenshot: "only-on-failure",
	},

	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 120_000,
	},

	projects: [
		// Setup project - runs once to authenticate
		{
			name: "setup",
			testDir: "./apps/web/test",
			testMatch: /.*\.setup\.ts/,
			timeout: 180_000, // 3 minutes for manual MFA
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Use saved authentication state
				storageState: "apps/web/test/.auth/user.json",
			},
			dependencies: ["setup"],
		},
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				storageState: "apps/web/test/.auth/user.json",
			},
			dependencies: ["setup"],
		},
		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
				storageState: "apps/web/test/.auth/user.json",
			},
			dependencies: ["setup"],
		},
	],
});
