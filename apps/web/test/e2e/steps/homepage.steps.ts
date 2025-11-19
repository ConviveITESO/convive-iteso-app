import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am on the home page", async ({ page }) => {
	await page.goto("/");
});

When("the page finishes loading", async ({ page }) => {
	// Wait for network to be idle-ish
	await page.waitForLoadState("domcontentloaded");
});

Then("I should see the main document body", async ({ page }) => {
	await expect(page.locator("body")).toBeVisible();
});

Then("the application root should be visible", async ({ page }) => {
	const root = page.locator("#__next, [data-nextjs-react-root], body");
	await expect(root).toBeVisible();
});

Then("I should see the title {string}", async ({ page }, title: string) => {
	await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

Then("I should see the button {string}", async ({ page }, buttonText: string) => {
	await expect(page.getByRole("button", { name: buttonText })).toBeVisible();
});
