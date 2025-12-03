import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

let originalUsername = "";

Given("I navigate to the profile settings page", async ({ page }) => {
	await page.route(/\/user\/.+$/, async (route) => {
		const method = route.request().method();

		if (method === "PATCH") {
			await new Promise((r) => setTimeout(r, 500));
			const body = route.request().postDataJSON();
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					id: "fake-id",
					name: body.name || originalUsername,
					email: "test@example.com",
					role: "user",
					profile: body.profile || null,
				}),
			});
		} else {
			route.continue();
		}
	});

	await page.goto("/settings", { waitUntil: "domcontentloaded" });

	await page.waitForURL(/\/settings/, { timeout: 5000 });

	const usernameInput = page.locator('input#username[data-slot="input"]');
	await expect(usernameInput).toBeVisible({ timeout: 15000 });

	originalUsername = (await usernameInput.inputValue()) || "";
});

When("I change my username to {string}", async ({ page }, newUsername: string) => {
	const usernameInput = page.locator('input#username[data-slot="input"]');
	await expect(usernameInput).toBeEnabled();
	await expect(usernameInput).not.toHaveAttribute("disabled");

	const currentValue = await usernameInput.inputValue();

	await usernameInput.click({ clickCount: 3 });
	await page.waitForTimeout(100);
	await usernameInput.fill("");
	await usernameInput.fill(newUsername);

	const newValue = await usernameInput.inputValue();
	if (newValue === currentValue) {
		throw new Error(`Username did not change! Still: "${currentValue}"`);
	}

	await usernameInput.blur();
	await page.waitForTimeout(200);

	await page.click('label[for="username"]');

	await page.waitForTimeout(1500);
});

When("I upload a new profile picture", async ({ page }) => {
	const buffer = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
		"base64",
	);

	const fileInput = page.locator('input[type="file"]');

	await fileInput.setInputFiles({
		name: "profile-picture.png",
		mimeType: "image/png",
		buffer,
	});

	await page.waitForTimeout(1500);
});

Then("I should see the username saved successfully", async ({ page }) => {
	const editButton = page.getByRole("button", { name: /edit username/i });
	await expect(editButton).toBeVisible();

	const usernameInput = page.locator('input#username[data-slot="input"]');
	await expect(usernameInput).toBeDisabled();
	await expect(usernameInput).toHaveAttribute("disabled");
});

Then("the username field should display {string}", async ({ page }, expectedUsername: string) => {
	const usernameInput = page.locator('input#username[data-slot="input"]');
	await expect(usernameInput).toHaveValue(expectedUsername, { timeout: 10000 });
});

Then("the username should revert to the original value", async ({ page }) => {
	const usernameInput = page.locator('input#username[data-slot="input"]');
	await expect(usernameInput).toHaveValue(originalUsername, { timeout: 5000 });
});

Then("the edit mode should be disabled", async ({ page }) => {
	const usernameInput = page.locator('input#username[data-slot="input"]');
	await expect(usernameInput).toBeDisabled({ timeout: 5000 });
	await expect(usernameInput).toHaveAttribute("disabled");

	const editButton = page.getByRole("button", { name: /edit username/i });
	await expect(editButton).toBeVisible();
});

Then("the profile picture should be updated successfully", async ({ page }) => {
	const possibleSpinner = page.locator("div.animate-spin");
	if ((await possibleSpinner.count()) > 0) {
		await expect(possibleSpinner.first()).not.toBeVisible({ timeout: 10000 });
	}
});

Then("I should see the new profile image displayed", async ({ page }) => {
	const profileContainer = page.locator("div.rounded-full").first();
	await expect(profileContainer).toBeVisible({ timeout: 15000 });

	const img = profileContainer.locator("img");
	await expect(img).toBeVisible({ timeout: 10000 });

	const src = await img.getAttribute("src");
	const decodedSrc = src ? decodeURIComponent(src) : "";
	if (
		!src ||
		(!decodedSrc.includes("/convive-iteso-dev/profile/") &&
			!src.includes("%2Fconvive-iteso-dev%2Fprofile%2F"))
	) {
		throw new Error(`La imagen de perfil no se actualizó correctamente. src: ${src}`);
	}
});
