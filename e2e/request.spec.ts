import { expect, test } from '@playwright/test';
import { es, expectAlert, fillRequestForm, open, submitRequest } from './helpers.ts';

test('a person passes Turnstile and the request is accepted', async ({ page }) => {
	// Cloudflare's testing site key hands out a dummy token without a challenge.
	await submitRequest(page, '90000001');
	await expect(page.getByRole('heading', { name: es.requestSent.title })).toBeVisible();
});

test('without a Turnstile token the request is refused and nothing is saved', async ({ page }) => {
	// Simulates a bot, or a browser that cannot load the widget.
	await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
	await open(page, '/request');
	await expect(page.getByText(es.request.captchaUnavailable)).toBeVisible();
	await fillRequestForm(page, '90000002');
	await page.getByRole('button', { name: es.request.submit }).click();
	await expectAlert(page, es.request.captchaFailed);
	await expect(page).toHaveURL(/\/request$/);
	await expect(page.getByLabel(es.request.resident.nationalId)).toHaveValue('V-90000002');
});

test('a type chosen on the home page is preselected and missing data is listed', async ({
	page
}) => {
	await open(page, '/');
	// Each type card links to the form with that type chosen.
	await page.locator('a[href*="tipo="]').first().click();
	await expect(page).toHaveURL(/\/request\?tipo=/);
	await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
		timeout: 20_000
	});
	await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);

	await page.getByRole('button', { name: es.request.submit }).click();
	const summary = page.getByRole('alert').filter({ hasText: es.request.errorSummary });
	await expect(summary).toBeFocused();
	const nationalId = es.request.summaryRequired.replace('{field}', es.request.resident.nationalId);
	await page.getByRole('link', { name: nationalId }).click();
	await expect(page.getByLabel(es.request.resident.nationalId)).toBeFocused();
	// The type stays chosen, so it is not in the list.
	await expect(
		page.getByRole('link', { name: es.request.summaryChoose.replace('{field}', es.request.type) })
	).toHaveCount(0);
});
