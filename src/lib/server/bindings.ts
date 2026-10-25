// Cloudflare bindings (typed by `wrangler types` from wrangler.toml).
// SvelteKit 3 + adapter-cloudflare expose them through `cloudflare:workers`, both in
// production and in `vite dev` (emulated locally with wrangler's platform proxy).
import { env } from 'cloudflare:workers';
import { createDb, type Db } from './db.ts';

export function getDb(): Db {
	return createDb(env.DB);
}

export function getFilesBucket(): R2Bucket {
	return env.FILES;
}

export function getAppUrl(): string {
	return env.APP_URL;
}
