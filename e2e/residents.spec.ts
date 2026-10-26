import { expect, test } from '@playwright/test';
import { E2E_PASSWORD, E2E_USERS } from './config.ts';
import { es, login, open, submitRequest } from './helpers.ts';

const t = es.admin.residents;
const f = es.request.resident;

test('fixing a resident from a pending request changes the text to be issued', async ({ page }) => {
	await submitRequest(page, '90000004', {
		lastNames: 'Residente',
		streetAddress: 'CALLE EL PORVENIR'
	});
	await login(page, E2E_USERS.admin, E2E_PASSWORD);
	await expect(page.getByRole('heading', { name: es.admin.dashboard.title })).toBeVisible();

	await page.getByRole('link', { name: es.admin.nav.certificates }).click();
	await page.getByRole('link', { name: 'Prueba Residente' }).click();
	await page.getByRole('link', { name: es.admin.review.editResident }).click();
	await expect(page.getByRole('heading', { name: 'Prueba Residente' })).toBeVisible();
	await page.waitForLoadState('networkidle');

	await page.getByLabel(f.streetAddress).fill('calle El Porvenir');
	await page.getByLabel(f.maritalStatus).selectOption('married');
	// Coming from the request, applying to pending requests is pre-selected.
	await expect(page.getByLabel(t.applyToPending.replace('{n}', '1'))).toBeChecked();
	await page.getByRole('button', { name: t.save }).click();

	// Back on the review page, the preview uses the corrected data.
	await expect(page.getByRole('link', { name: es.admin.review.editResident })).toBeVisible();
	await expect(page.getByText('casada', { exact: false }).first()).toBeVisible();
	await expect(page.getByText(/domiciliada en calle El Porvenir/)).toBeVisible();
	await expect(page.getByText(es.admin.review.differs)).toHaveCount(0);
});

test('residents can be searched and a duplicate cédula is refused', async ({ page }) => {
	await submitRequest(page, '90000005', { lastNames: 'Duplicada' });
	await login(page, E2E_USERS.admin, E2E_PASSWORD);
	await expect(page.getByRole('heading', { name: es.admin.dashboard.title })).toBeVisible();

	await page.getByRole('link', { name: es.admin.nav.residents }).click();
	await page.getByLabel(t.searchLabel).fill('90.000.005');
	await page.getByRole('button', { name: t.search }).click();
	await expect(page.getByRole('row')).toHaveCount(2); // header + one resident
	await page.getByRole('link', { name: 'Prueba Duplicada' }).click();
	await expect(page.getByRole('heading', { name: t.historyTitle })).toBeVisible();
	const history = page.getByRole('listitem').filter({ hasText: t.submitted });
	await expect(history).toHaveCount(1);
	await expect(history).toContainText(es.certificateStatus.pending);

	await page.waitForLoadState('networkidle');
	await page.getByLabel(f.nationalId).fill('V-90000004');
	await page.getByRole('button', { name: t.save }).click();
	await expect(page.getByText(es.formErrors.duplicate_national_id)).toBeVisible();

	await open(page, '/admin/residents?q=90000005');
	await expect(page.getByRole('link', { name: 'Prueba Duplicada' })).toBeVisible();
});
