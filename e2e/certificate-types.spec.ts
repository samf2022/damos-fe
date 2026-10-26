import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_TEMPLATES } from '../src/lib/certificates/defaultTemplates.ts';
import { E2E_PASSWORD, E2E_USERS } from './config.ts';
import { es, login, open, submitRequest } from './helpers.ts';

const t = es.admin.certificateTypes;
const CONDUCT = DEFAULT_TEMPLATES.conduct;

// These tests edit the same certificate type in turn.
test.describe.configure({ mode: 'serial' });

async function openConductEditor(page: Page) {
	await login(page, E2E_USERS.admin, E2E_PASSWORD);
	await expect(page.getByRole('heading', { name: es.admin.dashboard.title })).toBeVisible();
	return gotoConductEditor(page);
}

/** For an admin who is already logged in. */
async function gotoConductEditor(page: Page) {
	await open(page, '/admin');
	await page.getByRole('link', { name: es.admin.nav.certificateTypes }).click();
	await page.getByRole('link', { name: `${t.edit}: ${CONDUCT.title}` }).click();
	await expect(page.getByRole('heading', { name: t.editTitle })).toBeVisible();
	await page.waitForLoadState('networkidle');
	return page.getByLabel(t.fields.body);
}

async function save(page: Page) {
	await page.getByRole('button', { name: t.save }).click();
	await expect(page.getByRole('status').filter({ hasText: t.saved })).toBeVisible();
}

test('reviewers cannot open the editor', async ({ page }) => {
	await login(page, E2E_USERS.reviewer, E2E_PASSWORD);
	await expect(page.getByRole('heading', { name: es.admin.dashboard.title })).toBeVisible();
	await expect(page.getByRole('link', { name: es.admin.nav.certificateTypes })).toHaveCount(0);
	await open(page, '/admin/certificate-types');
	await expect(page.getByText(es.errors.forbidden)).toBeVisible();
});

test('the preview follows the text and mistakes are caught before saving', async ({ page }) => {
	const body = await openConductEditor(page);
	const preview = page.getByTestId('preview');

	await body.fill('Hacemos constar que conocemos a ');
	await body.press('End');
	await page.getByRole('button', { name: '{{resident.fullName}}' }).click();
	await expect(body).toHaveValue('Hacemos constar que conocemos a {{resident.fullName}}');
	await expect(preview).toContainText('conocemos a MARÍA FERNANDA PÉREZ GÓMEZ');
	await page.getByLabel(t.previewResident).selectOption('M');
	await expect(preview).toContainText('conocemos a JOSÉ LUIS RODRÍGUEZ DÍAZ');

	await body.fill('Texto para {{resident.fulName}} con {llave suelta');
	const problems = page.getByRole('alert');
	await expect(problems).toContainText(`${t.problems.unknown} {{resident.fulName}}`);
	await expect(problems).toContainText(t.problems.missingRequired);
	await expect(problems).toContainText(t.problems.strayBraces);
	await page.getByRole('button', { name: t.save }).click();
	await expect(problems).toContainText(t.problems.unknown);

	// Nothing was stored.
	await page.reload({ waitUntil: 'networkidle' });
	await expect(body).toHaveValue(CONDUCT.body);
});

test('saved wording is used for pending requests and can be restored', async ({ page }) => {
	await submitRequest(page, '90000003', { type: CONDUCT.title, lastNames: 'Editor' });

	const body = await openConductEditor(page);
	await expect(page.getByText(t.pendingNotice.replace('{n}', '1'))).toBeVisible();
	await body.fill(
		CONDUCT.body.replace('Constancia que expedimos', 'Constancia que con gusto expedimos')
	);
	await save(page);

	await page.getByRole('link', { name: es.admin.nav.certificates }).click();
	await page.getByRole('link', { name: 'Prueba Editor' }).click();
	await expect(page.getByText('Constancia que con gusto expedimos')).toBeVisible();

	await page.goBack();
	await page.goBack();
	await page.waitForLoadState('networkidle');
	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: t.restore }).click();
	await expect(body).toHaveValue(CONDUCT.body);
	await save(page);
	await page.reload({ waitUntil: 'networkidle' });
	await expect(body).toHaveValue(CONDUCT.body);
});

test('an unavailable type disappears from the public form', async ({ page }) => {
	await openConductEditor(page);
	const available = page.getByLabel(t.fields.isActive);
	await available.uncheck();
	await save(page);
	// Plain load: the Turnstile widget never lets the network go idle.
	await page.goto('/request');
	await expect(page.getByRole('radio', { name: CONDUCT.title })).toHaveCount(0);

	await gotoConductEditor(page);
	await available.check();
	await save(page);
	await page.goto('/request');
	await expect(page.getByRole('radio', { name: CONDUCT.title })).toBeVisible();
});
