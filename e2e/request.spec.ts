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
	await fillRequestForm(page, '90000002');
	await expect(page.getByText(es.request.captchaUnavailable)).toBeVisible();
	await page.getByRole('button', { name: es.request.submit }).click();
	await expectAlert(page, es.request.captchaFailed);
	await expect(page).toHaveURL(/\/request$/);
	// Still on the review, with the data kept.
	await expect(page.getByText('V-90000002')).toBeVisible();
});

test('the form goes one step at a time and explains what is missing', async ({ page }) => {
	const w = es.request.wizard;
	await open(page, '/');
	// Each type card links to the form with that type chosen.
	await page.locator('a[href*="tipo="]').first().click();
	await expect(page).toHaveURL(/\/request\?tipo=/);
	await page.waitForLoadState('networkidle');
	await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
	await page.getByRole('button', { name: w.next }).click();

	// Nothing typed: the step stays, says what to do and puts the cursor on the first box.
	await expect(page.getByRole('heading', { name: w.steps.identity.title })).toBeFocused();
	await page.getByRole('button', { name: w.next }).click();
	await expect(page.getByText(w.required.national_id)).toBeVisible();
	await expect(page.getByLabel(w.fields.nationalId)).toBeFocused();
	await page.getByLabel(w.fields.nationalId).fill('12A');
	await expect(page.getByText(es.formErrors.invalid_national_id)).toBeVisible();
	await page.getByLabel(w.fields.nationalId).fill('12345678');
	await expect(page.getByText(es.formErrors.invalid_national_id)).toHaveCount(0);

	// The phone's back button goes to the previous step, not away from the form.
	await page.goBack();
	await expect(page.getByRole('heading', { name: w.steps.type.title })).toBeVisible();
	await expect(page).toHaveURL(/\/request/);
});

test('a detail can be changed from the review without going through every step', async ({
	page
}) => {
	const w = es.request.wizard;
	await open(page, '/request');
	await fillRequestForm(page, '90000006');
	await page
		.getByRole('button', { name: w.changeLabel.replace('{field}', w.fields.phone.toLowerCase()) })
		.click();
	await page.getByLabel(w.fields.phone).fill('04241112233');
	await page.getByRole('button', { name: w.backToReview }).click();
	await expect(page.getByRole('heading', { name: w.steps.review.title })).toBeVisible();
	await expect(page.getByRole('definition').filter({ hasText: '0424-1112233' })).toBeVisible();
	// Answers adapt to the person: "Soltera", not "Soltero(a)".
	await expect(page.getByRole('definition').filter({ hasText: 'Soltera' })).toBeVisible();
});
