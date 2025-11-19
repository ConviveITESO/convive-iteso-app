import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
	features: "apps/web/test/e2e/features/***.feature",
	steps: "apps/web/test/e2e/steps/***.steps.ts",
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
		// biome-ignore lint/style/useNamingConvention: Playwright's official property name
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		video: "retain-on-failure",
		screenshot: "only-on-failure",
	},

	webServer: {
		command: "pnpm --filter ./apps/web dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 120_000,
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],
});
