import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

/**
 * Reuse: "there is an available event named {string}"
 * Reuse: "I register for the event"
 * Reuse: "I open the event {string} from the feed"
 *
 * We ONLY add the missing unsubscribe-specific steps.
 */

/**
 * Navigate to My Events
 */
When("I navigate to the my events page", async ({ page }) => {
	await page.goto("/my-events");
	await page.waitForLoadState("domcontentloaded");
});

/**
 * Reuse the "I open the event" + registration steps to guarantee subscription
 */
Given("I am registered to the event {string}", async ({ page }, eventName: string) => {
	// Reuse existing step: open event in feed
	const openBtn = page.getByRole("button", { name: `Open event ${eventName}` }).first();

	await page.goto("/feed");
	await page.waitForLoadState("domcontentloaded");

	await expect(openBtn).toBeVisible({ timeout: 20000 });
	await openBtn.click();

	// Wait for event detail page
	await page.waitForURL(/\/events\/.+/);
	await page.waitForLoadState("networkidle");

	// Reuse register logic
	const subscribed = page.getByText(/You are subscribed/i);
	if (await subscribed.isVisible()) return;

	const registerButton = page.getByRole("button", { name: /register for event/i });
	if (await registerButton.count()) {
		await registerButton.first().click();
	}
});

/**
 * Click the unsubscribe button inside My Events
 */
When("I click the unsubscribe button for {string}", async ({ page }, eventName: string) => {
	// Locate card
	const card = page.locator('div[data-slot="card"]', {
		has: page.getByRole("heading", { name: eventName }),
	});

	await expect(card).toBeVisible({ timeout: 7000 });

	// Button inside div.absolute.top-3.right-3 button
	const unsubscribeButton = card.locator("div.absolute.top-3.right-3 button").first();

	await expect(unsubscribeButton).toBeVisible({ timeout: 7000 });
	await unsubscribeButton.click();
});

/**
 * Confirm unsubscribe
 */
When("I confirm the event unsubscription", async ({ page }) => {
	const dialog = page.getByRole("dialog", { name: /cancel subscription/i });
	await expect(dialog).toBeVisible({ timeout: 7000 });

	const confirmBtn = dialog.getByRole("button", { name: /yes, cancel/i });
	await expect(confirmBtn).toBeVisible({ timeout: 7000 });

	await confirmBtn.click();
	await expect(dialog).toBeHidden({ timeout: 10000 });
});

/**
 * Validation: event must disappear from My Events
 */
Then(
	"I should not see the event {string} in my upcoming events",
	async ({ page }, eventName: string) => {
		await page.goto("/my-events");
		await page.waitForLoadState("networkidle");

		const eventHeading = page.getByRole("heading", { name: eventName });
		await expect(eventHeading).toHaveCount(0);
	},
);

/**
 * Required by event-unsubscribe.feature
 */
Given("I am on the subscriptions page", async ({ page }) => {
	await page.goto("/my-events");
	await page.waitForLoadState("domcontentloaded");
});

/**
 * Required by event-unsubscribe.feature
 */
Then(
	"I should not see the subscribed event {string} in the list",
	async ({ page }, eventName: string) => {
		await page.goto("/my-events");
		await page.waitForLoadState("networkidle");

		const eventHeading = page.getByRole("heading", { name: eventName });
		await expect(eventHeading).toHaveCount(0);
	},
);
