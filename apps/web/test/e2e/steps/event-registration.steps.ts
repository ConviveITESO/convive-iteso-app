import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

async function createEvent(page: Page, eventName: string) {
	await page.goto("/events/create");
	await page.waitForLoadState("domcontentloaded");

	await page.getByLabel(/name/i).fill(eventName);
	await page.getByLabel(/description/i).fill("Automated test event for registration flows");

	const startDate = new Date();
	startDate.setDate(startDate.getDate() + 1);
	const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

	const startDateString = startDate.toISOString().slice(0, 10);
	const endDateString = endDate.toISOString().slice(0, 10);

	await page.locator("#startDate").fill(startDateString);
	await page.locator("#startTime").fill("10:00");
	await page.locator("#endDate").fill(endDateString);
	await page.locator("#endTime").fill("12:00");

	const locationTrigger = page.getByRole("combobox", { name: /location/i });
	if (await locationTrigger.count()) {
		await locationTrigger.click();
		const firstOption = page.getByRole("option").first();
		await firstOption.waitFor({ state: "visible", timeout: 5000 });
		await firstOption.click();
	} else {
		const fallbackLocation = page.getByText("Location").locator("..").locator('[role="combobox"]');
		await fallbackLocation.click();
		await page.getByRole("option").first().click();
	}

	const fileInput = page.locator('input[type="file"]');
	const buffer = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
	await fileInput.setInputFiles({
		name: "registration-test.gif",
		mimeType: "image/gif",
		buffer,
	});

	await page.locator("#quota").fill("25");

	await page.getByRole("button", { name: /create event/i }).click();
	await page.waitForURL(/\/manage-events$/, { timeout: 15000 });
	await expect(page.getByText(eventName)).toBeVisible({ timeout: 15000 });
}

Given("I create a new event named {string}", async ({ page }, eventName: string) => {
	await createEvent(page, eventName);
});

Given("there is an available event named {string}", async ({ page }, eventName: string) => {
	await createEvent(page, eventName);
});

When("I open the event {string} from manage events", async ({ page }, eventName: string) => {
	await page.goto("/manage-events");
	await page.waitForLoadState("domcontentloaded");

	const eventCardHeading = page.getByRole("heading", { name: eventName });
	await expect(eventCardHeading).toBeVisible({ timeout: 15000 });
	await eventCardHeading.click();

	await page.waitForURL(/\/events\/.+/, { timeout: 15000 });
	await page.waitForLoadState("networkidle");
});

When("I open the event {string} from the feed", async ({ page }, eventName: string) => {
	await page.goto("/feed");
	await page.waitForLoadState("domcontentloaded");

	const eventCardHeading = page.getByRole("heading", { name: eventName }).first();
	await expect(eventCardHeading).toBeVisible({ timeout: 20000 });
	await eventCardHeading.click();

	await page.waitForURL(/\/events\/.+/, { timeout: 15000 });
	await page.waitForLoadState("networkidle");
});

async function registerForCurrentEvent(page: Page) {
	const alreadyRegistered = page.getByText(/You are subscribed/i);
	if (await alreadyRegistered.isVisible()) {
		return;
	}

	const registerButton = page.getByRole("button", { name: /register for event/i });
	if (await registerButton.count()) {
		await expect(registerButton.first()).toBeEnabled({ timeout: 5000 });
		await registerButton.first().click();
		return;
	}

	const waitlistButton = page.getByRole("button", { name: /enter waitlist/i });
	if (await waitlistButton.count()) {
		await expect(waitlistButton.first()).toBeEnabled({ timeout: 5000 });
		await waitlistButton.first().click();
	}
}

When("I register a user for the event", async ({ page }) => {
	await registerForCurrentEvent(page);
});

When("I register for the event", async ({ page }) => {
	await registerForCurrentEvent(page);
});

Then("I should see the registration confirmation", async ({ page }) => {
	const confirmation = page.getByText(/You are (subscribed|waitlisted)/i);
	await expect(confirmation).toBeVisible({ timeout: 15000 });
});
