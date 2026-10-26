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
