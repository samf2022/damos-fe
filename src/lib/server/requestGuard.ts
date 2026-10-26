// Anti-spam checks for the public request form, run before validating its contents.
import type { Db } from './db.ts';
import { consumeRateLimit, type RateLimitRule } from './rateLimit.ts';
import { verifyTurnstile, type TurnstileConfig } from './turnstile.ts';

/** Per connection. Generous because mobile carriers put many people behind one IP. */
export const REQUEST_LIMIT: RateLimitRule = { limit: 10, windowMs: 60 * 60 * 1000 };

export type RequestGuardResult = { ok: true } | { ok: false; reason: 'rate_limited' | 'captcha' };

export async function guardPublicRequest(
	db: Db,
	input: {
		ip: string;
		turnstileToken: string | null;
		/** Null while Turnstile is not configured: only the rate limit applies. */
		turnstile: TurnstileConfig | null;
		fetcher?: typeof fetch;
	},
	now: Date = new Date()
): Promise<RequestGuardResult> {
	// Counted before the CAPTCHA so failed attempts also spend the quota.
	const limit = await consumeRateLimit(db, `request:ip:${input.ip}`, REQUEST_LIMIT, now);
	if (!limit.allowed) return { ok: false, reason: 'rate_limited' };

	if (input.turnstile) {
		const human = await verifyTurnstile(input.turnstileToken, {
			secretKey: input.turnstile.secretKey,
			remoteIp: input.ip,
			fetcher: input.fetcher
		});
		if (!human) return { ok: false, reason: 'captcha' };
	}
	return { ok: true };
}
