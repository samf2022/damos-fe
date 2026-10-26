import { expect, test } from '@playwright/test';
import { E2E_PASSWORD, E2E_USERS } from './config.ts';
import { es, expectAlert, login } from './helpers.ts';

test('an admin logs in and sees the dashboard with Turnstile active', async ({ page }) => {
	await login(page, E2E_USERS.admin, E2E_PASSWORD);
	await expect(page.getByRole('heading', { name: es.admin.dashboard.title })).toBeVisible();
	await expect(page.getByText(es.admin.dashboard.turnstileOff)).toHaveCount(0);
});

test('five failed attempts lock the account, even for the right password', async ({ page }) => {
	const locked = es.login.tooManyAttempts.split('{minutes}')[0];
	for (let attempt = 1; attempt <= 4; attempt++) {
		await login(page, E2E_USERS.locked, `incorrecta-${attempt}`);
		await expectAlert(page, es.login.invalidCredentials);
	}
	await login(page, E2E_USERS.locked, 'incorrecta-5');
	await expectAlert(page, locked);
	await expectAlert(page, '15 minutos');

	await login(page, E2E_USERS.locked, E2E_PASSWORD);
	await expectAlert(page, locked);
	await expect(page).toHaveURL(/\/admin\/login/);
});
