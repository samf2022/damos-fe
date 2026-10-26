// Cloudflare bindings (typed by `wrangler types` from wrangler.toml).
// SvelteKit 3 + adapter-cloudflare expose them through `cloudflare:workers`, both in
// production and in `vite dev` (emulated locally with wrangler's platform proxy).
import { env } from 'cloudflare:workers';
import { createDb, type Db } from './db.ts';
import type { TurnstileConfig } from './turnstile.ts';

export function getDb(): Db {
	return createDb(env.DB);
}

export function getFilesBucket(): R2Bucket {
	return env.FILES;
}

export function getAppUrl(): string {
	return env.APP_URL;
}

/**
 * Turnstile keys: TURNSTILE_SITE_KEY is a public var, TURNSTILE_SECRET_KEY a secret
 * (`wrangler secret put`). Null until both are set, which leaves the CAPTCHA off.
 */
export function getTurnstileConfig(): TurnstileConfig | null {
	const vars = env as { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string };
	const siteKey = vars.TURNSTILE_SITE_KEY?.trim();
	const secretKey = vars.TURNSTILE_SECRET_KEY?.trim();
	return siteKey && secretKey ? { siteKey, secretKey } : null;
}
