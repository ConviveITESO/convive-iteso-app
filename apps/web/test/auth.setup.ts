import fs from "node:fs";
import path from "node:path";
import { test as setup } from "@playwright/test";

// Save auth state where playwright.config.ts expects to load it
const authFile = path.join(__dirname, ".auth/user.json");
// biome-ignore lint/style/noProcessEnv: false positive
const { TEST_USER_EMAIL = "", TEST_USER_PASSWORD = "" } = process.env;

setup("authenticate", async ({ page }) => {
	await fs.promises.mkdir(path.dirname(authFile), { recursive: true });

	// Perform authentication steps
	await page.goto("/");
	await page.getByRole("button", { name: "Sign in with ITESO" }).click();

	// Wait for redirect to Microsoft login
	await page.waitForURL(/login.microsoftonline.com/);

	// Fill in email
	await page.locator("input[type='email']").fill(TEST_USER_EMAIL);
	await page.locator("input[type='submit']").click();

	// Fill in password
	await page.locator("input[type='password']").waitFor();
	await page.locator("input[type='password']").fill(TEST_USER_PASSWORD);
	await page.locator("input[type='submit']").click();

	// Wait for successful redirect to feed page (after MFA)
	await page.waitForURL(/\/feed/, { timeout: 120000 }); // 2 minutes for MFA

	// Save signed-in state
	await page.context().storageState({ path: authFile });
});
