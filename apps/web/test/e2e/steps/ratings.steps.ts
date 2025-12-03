/**
 * IMPORTANT: These tests require seeded database
 *
 * Before running tests, seed the database:
 * ```
 * pnpm run seed
 * ```
 *
 * The tests use seeded events (Event3-Event19) which are past/ended events.
 * Without seeded data, tests will fail with "No ended event found" error.
 */

import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// Extend page object to store test context
interface TestContext {
	testEventId?: string;
}

// Given Steps - Test Data Setup (UI-based)

Given("I have an ended event I am subscribed to", async ({ page }) => {
	// Just store the event ID - the When steps will navigate and do everything
	const eventId = "4f46acd2-07ca-4671-a66e-860e58fe3432";
	(page as unknown as TestContext).testEventId = eventId;
});

// When Steps - UI Interactions

When("I navigate to the event page", async ({ page }) => {
	const eventId = (page as unknown as TestContext).testEventId;
	if (!eventId) {
		throw new Error("No event ID found in test context");
	}

	await page.goto(`/events/${eventId}`);
	await page.waitForLoadState("networkidle");

	// Subscribe if button is visible (needed to rate the event)
	const registerButton = page.getByRole("button", { name: /register for event/i });
	if (await registerButton.isVisible()) {
		await registerButton.click();
		await page.waitForTimeout(1000);
		await page.reload();
		await page.waitForLoadState("networkidle");
	}
});

When("I click the {string} button", async ({ page }, buttonText: string) => {
	const button = page.getByRole("button", { name: new RegExp(buttonText, "i") });
	await button.waitFor({ state: "visible" });
	await button.click();

	// If this is "Rate this event", wait for the modal to appear
	if (buttonText.toLowerCase().includes("rate")) {
		await page.waitForTimeout(500);
	}
});

When("I select {int} stars", async ({ page }, starCount: number) => {
	// Find the rating form
	const form = page.locator("#ratingModal");
	await form.waitFor({ state: "visible" });

	// Use the rating-star class to target only the star SVGs
	await form
		.locator(".rating-star svg")
		.nth(starCount - 1)
		.click();
	await page.waitForTimeout(300);
});

When("I enter {string} in the comment field", async ({ page }, commentText: string) => {
	// Find comment field within the rating form
	const form = page.locator("#ratingModal");
	const commentField = form.locator('textarea[name="comment"]');
	await commentField.waitFor({ state: "visible" });
	await commentField.fill(commentText);
});

// Then Steps - Assertions

Then("the page should reload", async ({ page }) => {
	// Wait for the page to finish reloading
	await page.waitForLoadState("networkidle");

	// Additional wait to ensure all UI updates are complete
	await page.waitForTimeout(1000);
});

Then("I should see the {string} button disabled", async ({ page }, buttonText: string) => {
	const button = page.getByRole("button", { name: new RegExp(buttonText, "i") });
	await expect(button).toBeVisible();
	await expect(button).toBeDisabled();
});
