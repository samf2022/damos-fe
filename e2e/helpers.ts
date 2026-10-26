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

/** Fictitious applicant; the national id varies so tests never collide on "duplicate pending". */
export async function fillRequestForm(
	page: Page,
	nationalIdNumber: string,
	options: { type?: string; lastNames?: string; streetAddress?: string } = {}
) {
	const t = es.request;
	if (options.type) await page.getByRole('radio', { name: options.type }).check();
	else await page.getByRole('radio').first().check();
	await page.getByLabel(t.resident.nationalId).fill(`V-${nationalIdNumber}`);
	await page.getByLabel(t.resident.gender).selectOption('F');
	await page.getByLabel(t.resident.firstNames).fill('Prueba');
	await page.getByLabel(t.resident.lastNames).fill(options.lastNames ?? 'Automatizada');
	await page.getByLabel(t.resident.maritalStatus).selectOption('single');
	await page.getByLabel(t.resident.streetAddress).fill(options.streetAddress ?? 'Calle de Pruebas');
	await page.getByLabel(t.resident.phone).fill('0412-0000000');
	await page.getByLabel(t.knownSince).fill('10');
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
	// The widget keeps the network busy, so wait for its token instead of "networkidle":
	// it is rendered on mount, so a token also means the page is hydrated.
	await page.goto('/request');
	await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
		timeout: 20_000
	});
	await fillRequestForm(page, nationalIdNumber, options);
	await page.getByRole('button', { name: es.request.submit }).click();
	await expect(page).toHaveURL(/\/request\/sent$/);
}
