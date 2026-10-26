import { expect, type Page } from '@playwright/test';
import { es } from '../src/lib/i18n/es.ts';

export { es };

/** Waits for hydration: filling inputs earlier lets Svelte reset them. */
export async function open(page: Page, path: string) {
	await page.goto(path, { waitUntil: 'networkidle' });
}

export async function login(page: Page, username: string, password: string) {
	await open(page, '/admin/login');
	await page.getByLabel(es.login.username).fill(username);
	await page.getByLabel(es.login.password).fill(password);
	await page.getByRole('button', { name: es.login.submit }).click();
}

/** Goes through every step of the public form with a fictitious applicant, up to the review. */
export async function fillRequestForm(
	page: Page,
	nationalIdNumber: string,
	options: { type?: string; lastNames?: string; streetAddress?: string } = {}
) {
	const w = es.request.wizard;
	const next = () => page.getByRole('button', { name: w.next }).click();
	if (options.type) await page.getByRole('radio', { name: options.type }).check();
	else await page.getByRole('radio').first().check();
	await next();
	await page.getByLabel(w.fields.nationalId).fill(`V-${nationalIdNumber}`);
	await page.getByLabel(w.fields.firstNames).fill('Prueba');
	await page.getByLabel(w.fields.lastNames).fill(options.lastNames ?? 'Automatizada');
	await next();
	await page.getByRole('radio', { name: w.fields.genderOptions.F }).check();
	await page.getByRole('radio', { name: 'Soltera' }).check();
	await next();
	await page.getByLabel(w.fields.streetAddress).fill(options.streetAddress ?? 'Calle de Pruebas');
	await page.getByLabel(w.fields.knownSince).fill('10');
	await next();
	await page.getByLabel(w.fields.phone).fill('0412-0000000');
	await next();
	await expect(page.getByRole('heading', { name: w.steps.review.title })).toBeVisible();
}

export async function expectAlert(page: Page, text: string) {
	await expect(page.getByRole('alert')).toContainText(text);
}

/** Submits the public form once Turnstile (testing key) has handed out its token. */
export async function submitRequest(
	page: Page,
	nationalIdNumber: string,
	options: Parameters<typeof fillRequestForm>[2] = {}
) {
	await open(page, '/request');
	await fillRequestForm(page, nationalIdNumber, options);
	// The widget is only on the review step; wait for its token before sending.
	await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
		timeout: 20_000
	});
	await page.getByRole('button', { name: es.request.submit }).click();
	await expect(page).toHaveURL(/\/request\/sent$/);
}
