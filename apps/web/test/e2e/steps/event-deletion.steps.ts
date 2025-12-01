import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

/**
 * Click the delete button inside the event CARD (not in detail page)
 */
When("I click the delete event button for {string}", async ({ page }, eventName: string) => {
	// 1. Localizar la card correcta usando data-slot="card"
	const card = page.locator('div[data-slot="card"]', {
		has: page.getByRole("heading", { name: eventName }),
	});

	// 2. Dentro de esa card, el botón delete es el ÚLTIMO con data-slot="button"
	const deleteBtn = card.locator('button[data-slot="button"]').last();

	// 3. Validar que esté visible
	await expect(deleteBtn).toBeVisible({ timeout: 7000 });

	// 4. Click → abre modal "Delete Event"
	await deleteBtn.click();
});

/**
 * Confirm deletion inside modal
 */
When("I confirm the event deletion", async ({ page }) => {
	const dialog = page.locator('[role="dialog"][data-state="open"]');
	await expect(dialog).toBeVisible({ timeout: 5000 });

	const confirmBtn = dialog.getByRole("button", { name: /^delete$/i });
	await expect(confirmBtn).toBeVisible({ timeout: 5000 });

	await confirmBtn.click();

	// Esperar a que desaparezca el modal
	await expect(dialog).toBeHidden({ timeout: 10_000 });
});

/**
 * Validate the event is no longer visible in /manage-events
 */
Then(
	"I should not see the event {string} in the events list",
	async ({ page }, eventName: string) => {
		await page.goto("/manage-events");
		await page.waitForLoadState("networkidle");

		const eventHeading = page.getByRole("heading", { name: eventName });

		await expect(eventHeading).toHaveCount(0);
	},
);
