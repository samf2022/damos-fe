import { defineConfig, devices } from '@playwright/test';
import { E2E_BASE_URL } from './e2e/config.ts';

export default defineConfig({
	testDir: 'e2e',
	// Tests share one server and database; keep them in a predictable order.
	workers: 1,
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: E2E_BASE_URL,
		locale: 'es-VE',
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'node e2e/server.ts',
		url: E2E_BASE_URL,
		// Always a fresh database: never reuse a server that may hold old state.
		reuseExistingServer: false,
		timeout: 120_000,
		stdout: 'ignore',
		stderr: 'pipe'
	}
});
