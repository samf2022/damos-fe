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
export async function fillRequestForm(page: Page, nationalIdNumber: string) {
	const t = es.request;
	await page.getByRole('radio').first().check();
	await page.getByLabel(t.resident.nationalId).fill(`V-${nationalIdNumber}`);
	await page.getByLabel(t.resident.gender).selectOption('F');
	await page.getByLabel(t.resident.firstNames).fill('Prueba');
	await page.getByLabel(t.resident.lastNames).fill('Automatizada');
	await page.getByLabel(t.resident.maritalStatus).selectOption('single');
	await page.getByLabel(t.resident.streetAddress).fill('Calle de Pruebas');
	await page.getByLabel(t.resident.phone).fill('0412-0000000');
	await page.getByLabel(t.knownSince).fill('10');
}

export async function expectAlert(page: Page, text: string) {
	await expect(page.getByRole('alert')).toContainText(text);
}
