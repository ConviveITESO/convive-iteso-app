import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

let assistantsPanelId: string | null = null;

Given("I navigate to the manage event page", async ({ page }) => {
	await page.goto("/manage-events", { waitUntil: "domcontentloaded" });
	await page.waitForURL(/\/manage-events/, { timeout: 5000 });
});

When("I click the eye icon for the event {string}", async ({ page }, eventName: string) => {
	const cardTitle = page.getByRole("heading", { name: new RegExp(eventName, "i") }).first();
	await expect(cardTitle).toBeVisible({ timeout: 30_000 });

	const card = cardTitle.locator('xpath=ancestor::*[@data-slot="card"]');
	const eyeButton = card.locator("button:has(svg.lucide-eye)");
	await expect(eyeButton).toBeVisible({ timeout: 10_000 });
	await eyeButton.click();
});

Then("I should be redirected to the event analytics page", async ({ page }) => {
	await page.waitForURL(/\/events\/[^/]+\/analytics/, { timeout: 60_000 });
	expect(page.url()).toMatch(/\/events\/[^/]+\/analytics/);
});

When("I click the Assistants tab", async ({ page }) => {
	const assistantsTab = page.getByRole("tab", { name: /assistants/i });
	await expect(assistantsTab).toBeVisible({ timeout: 15_000 });

	const controls = await assistantsTab.getAttribute("aria-controls");
	await assistantsTab.click();

	assistantsPanelId = controls || null;
	if (assistantsPanelId) {
		const specificPanel = page.locator(`#${assistantsPanelId}`);
		await expect(specificPanel).toBeVisible({ timeout: 30_000 });
	} else {
		const fallbackPanel = page
			.locator('[role="tabpanel"]')
			.filter({ hasText: /Event Quota|no subscribers yet/i });
		await expect(fallbackPanel.first()).toBeVisible({ timeout: 30_000 });
	}
});
When("I search assistants for {string}", async ({ page }, term: string) => {
	const assistantsPanel = assistantsPanelId
		? page.locator(`#${assistantsPanelId}`)
		: page
				.locator('[role="tabpanel"]')
				.filter({ hasText: /Event Quota|no subscribers yet/i })
				.first();
	await expect(assistantsPanel).toBeVisible({ timeout: 30_000 });

	const emptyState = assistantsPanel.getByText(/no subscribers yet/i);
	if (await emptyState.isVisible().catch(() => false)) return;

	const searchInput = assistantsPanel.getByPlaceholder("Search...");
	await expect(searchInput).toBeVisible({ timeout: 10_000 });
	await searchInput.fill("");
	await searchInput.type(term);
	await page.waitForTimeout(500);
});

Then("I should see the assistants list with quota and attendee", async ({ page }) => {
	const assistantsPanel = assistantsPanelId
		? page.locator(`#${assistantsPanelId}`)
		: page
				.locator('[role="tabpanel"]')
				.filter({ hasText: /Event Quota|no subscribers yet/i })
				.first();
	await expect(assistantsPanel).toBeVisible({ timeout: 30_000 });

	// If empty state, assert and return
	const emptyState = assistantsPanel.getByText(/no subscribers yet/i);
	if (await emptyState.isVisible().catch(() => false)) {
		await expect(emptyState).toBeVisible();
		return;
	}

	await expect(assistantsPanel.getByText(/Event Quota:\s*\d+/i)).toBeVisible();

	const attendeeNames = assistantsPanel.locator(".font-medium");
	await expect(attendeeNames.first()).toBeVisible({ timeout: 10_000 });

	const badgeRegex = /registered|waitlisted|cancelled|attended/i;
	const badges = assistantsPanel.getByText(badgeRegex);
	await expect(badges.first()).toBeVisible({ timeout: 10_000 });
});

Then("I should see at least one assistant in the list", async ({ page }) => {
	const assistantsPanel = assistantsPanelId
		? page.locator(`#${assistantsPanelId}`)
		: page
				.locator('[role="tabpanel"]')
				.filter({ hasText: /Event Quota|no subscribers yet/i })
				.first();
	await expect(assistantsPanel).toBeVisible({ timeout: 30_000 });

	const emptyState = assistantsPanel.getByText(/no subscribers yet/i);
	expect(await emptyState.isVisible().catch(() => false)).toBeFalsy();

	const items = assistantsPanel.locator("ul li");
	await expect(items.first()).toBeVisible({ timeout: 10_000 });
});

Then("I should see no assistants in the list", async ({ page }) => {
	const assistantsPanel = assistantsPanelId
		? page.locator(`#${assistantsPanelId}`)
		: page
				.locator('[role="tabpanel"]')
				.filter({ hasText: /Event Quota|no subscribers yet/i })
				.first();
	await expect(assistantsPanel).toBeVisible({ timeout: 30_000 });

	const items = assistantsPanel.locator("ul li");
	await expect(items).toHaveCount(0, { timeout: 10_000 });
});
