import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// Authentication setup - now handled by setup project with storageState
Given("I am authenticated as an event creator", async () => {
	// Authentication is already set up via the setup project
	// The storageState is loaded automatically from apps/web/test/.auth/user.json
});

// Navigation steps
Given("I am on the feed page", async ({ page }) => {
	// Navigate to feed page
	await page.goto("/feed");
	await page.waitForLoadState("domcontentloaded");
});

When("I navigate to the manage events page", async ({ page }) => {
	// Navigate directly to manage events page
	await page.goto("/manage-events");
	await page.waitForLoadState("domcontentloaded");
});

When("I click the create event button", async ({ page }) => {
	await page.getByRole("button", { name: /create event/i }).click();
	await page.waitForURL("/events/create");
});

// Form filling steps
When("I fill in the event name with {string}", async ({ page }, name: string) => {
	await page.getByLabel(/name/i).fill(name);
});

When("I fill in the event description with {string}", async ({ page }, description: string) => {
	await page.getByLabel(/description/i).fill(description);
});

When("I select the start date and time", async ({ page }) => {
	// Set to tomorrow at 10:00 AM
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Format date as YYYY-MM-DD for date input
	const dateString = tomorrow.toISOString().slice(0, 10);
	// Format time as HH:MM for time input
	const timeString = "10:00";

	await page.locator("#startDate").fill(dateString);
	await page.locator("#startTime").fill(timeString);
});

When("I select the end date and time", async ({ page }) => {
	// Set to tomorrow at 12:00 PM (2 hours after start)
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Format date as YYYY-MM-DD for date input
	const dateString = tomorrow.toISOString().slice(0, 10);
	// Format time as HH:MM for time input
	const timeString = "12:00";

	await page.locator("#endDate").fill(dateString);
	await page.locator("#endTime").fill(timeString);
});

When("I select a location", async ({ page }) => {
	// The form may already have a default location selected
	// We just need to ensure there's a valid location
	// If needed, we can click the dropdown and select a different one
	const locationLabel = await page.getByText("Location").locator("..").locator('[role="combobox"]');

	// Check if it says "Select a location" or already has a location
	const currentText = await locationLabel.textContent();

	if (currentText?.includes("Select a location")) {
		// Need to select a location
		await locationLabel.click();
		await page.waitForSelector('[role="option"]', { timeout: 5000 });
		await page.locator('[role="option"]').first().click();
	}
	// else location is already selected, continue
});

When("I upload an event image", async ({ page }) => {
	// Create a minimal test image as a buffer
	const fileInput = page.locator('input[type="file"]');

	// Create a minimal 1x1 GIF image
	const buffer = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
	await fileInput.setInputFiles({
		name: "test-event-image.gif",
		mimeType: "image/gif",
		buffer: buffer,
	});
});

When("I set the event quota to {string}", async ({ page }, quota: string) => {
	await page.getByLabel(/quota/i).fill(quota);
});

When("I click the save button", async ({ page }) => {
	// Click the create event button (not save, as per the form)
	await page.getByRole("button", { name: /create event/i }).click();
});

// Assertion steps
Then("I should be redirected to the manage events page", async ({ page }) => {
	await page.waitForURL("/manage-events", { timeout: 10000 });
	expect(page.url()).toContain("/manage-events");
});

Then("I should see my created event in the events list", async ({ page }) => {
	// Refresh the page to load the newly created event
	await page.reload();
	await page.waitForLoadState("networkidle");

	// Check if the event appears in the list
	// The event should be visible after the refresh
	await expect(page.getByText("Test E2E Event")).toBeVisible({ timeout: 10000 });
});
