// Shared by the e2e server script, playwright.config.ts and the tests. Fictitious data only.
export const E2E_PORT = 5180;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
/** Separate local state (D1, R2) so e2e runs never touch the developer's data. */
export const E2E_STATE_DIR = '.wrangler/e2e';

export const E2E_PASSWORD = 'e2e-clave-segura-1';
export const E2E_USERS = {
	/** Logs in normally. */
	admin: 'e2e-admin',
	/** Gets locked out by the brute-force test. */
	locked: 'e2e-bloqueada'
} as const;
