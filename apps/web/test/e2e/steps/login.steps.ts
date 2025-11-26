import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am authenticated", async ({ page }) => {
	// Authentication state is already loaded from storageState in playwright.config.ts
	// This step just confirms we have the auth state
	await page.goto("/");
});

When("I navigate to the feed page", async ({ page }) => {
	await page.goto("/feed");
	await page.waitForLoadState("networkidle");
});

Then("I should see the feed page", async ({ page }) => {
	await expect(page).toHaveURL(/\/feed/);
	await expect(page.getByPlaceholder("Buscar eventos...")).toBeVisible();
});
