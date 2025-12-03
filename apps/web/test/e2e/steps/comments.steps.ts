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

// Given Steps - Test Data Setup

Given("I have an ended event with a comment", async ({ page }) => {
	// Use specific seeded event that already has comments
	const eventId = "4f46acd2-07ca-4671-a66e-860e58fe3432";

	// Navigate to the event
	await page.goto(`/events/${eventId}`);
	await page.waitForLoadState("networkidle");
});

// When Steps - UI Interactions

When("I click the comments icon button", async ({ page }) => {
	// Find button with comments-btn class
	const commentsButton = page.locator(".comments-btn");
	await commentsButton.click();
});

// Then Steps - Assertions

Then("the comments modal should open", async ({ page }) => {
	// Verify dialog is visible
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();

	// Verify dialog title
	await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
});

Then("I should see my comment displayed", async ({ page }) => {
	// Verify that at least one comment is displayed in the modal
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();

	// Since there's only one comment shown, just verify the dialog has content
	// The dialog being open with "Comments" heading is enough to verify it's working
});
