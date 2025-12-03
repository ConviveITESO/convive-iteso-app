import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am an authenticated user", async () => {});

Given("I am on the feed page", async ({ page }) => {
	await page.goto("/feed");
});

When("I click on the first upcoming event", async ({ page }) => {
	const firstEvent = page.getByText(/Event\d/i).first();
	expect(firstEvent).toBeVisible();
	await firstEvent.click();
});

When("I click the subscribe button", async ({ page }) => {
	const subscribeBtn = page.getByRole("button", { name: /Register for event/i });
	await expect(subscribeBtn).toBeVisible();
	await subscribeBtn.click();
});

When("I click the go to group chat button", async ({ page }) => {
	const chatBtn = page.getByRole("button", { name: /Go to event group/i });
	await expect(chatBtn).toBeVisible();
	await chatBtn.click();
});

When("I type {string} into the chat input", async ({ page }, message: string) => {
	const input = page.getByPlaceholder(/Escribe un mensaje.../i);
	await expect(input).toBeVisible();
	await input.fill(message);
});

When("I send the message by pressing Enter", async ({ page }) => {
	const input = page.getByPlaceholder(/Escribe un mensaje.../i);
	await input.press("Enter");
});

Then("I should see {string} in the chat thread", async ({ page }, message: string) => {
	const chatMessage = page.getByText(message, { exact: true });
	await expect(chatMessage).toBeVisible();
});
