// Login with brute-force protection: failed attempts are counted per username and per IP,
// and both counters block further attempts (even with the right password) until they reset.
import { authenticate, deleteExpiredSessions, writeAuditLog, type SessionUser } from './auth.ts';
import type { Db } from './db.ts';
import {
	checkRateLimit,
	consumeRateLimit,
	deleteExpiredRateLimits,
	resetRateLimit,
	type RateLimitRule
} from './rateLimit.ts';

const MINUTE_MS = 60 * 1000;

export const LOGIN_LIMITS = {
	/** Guessing one account's password. */
	user: { limit: 5, windowMs: 15 * MINUTE_MS },
	/** Trying many usernames from one connection (generous: mobile carriers share IPs). */
	ip: { limit: 20, windowMs: 15 * MINUTE_MS }
} satisfies Record<string, RateLimitRule>;

const userKey = (username: string) => `login:user:${username.trim().toLowerCase()}`;
const ipKey = (ip: string) => `login:ip:${ip}`;

export type LoginAttempt =
	| { ok: true; user: SessionUser }
	| { ok: false; reason: 'invalid' }
	| { ok: false; reason: 'locked'; retryAfterSeconds: number };

export async function attemptLogin(
	db: Db,
	credentials: { username: string; password: string; ip: string },
	now: Date = new Date()
): Promise<LoginAttempt> {
	const keys = [
		[userKey(credentials.username), LOGIN_LIMITS.user],
		[ipKey(credentials.ip), LOGIN_LIMITS.ip]
	] as const;

	const before = await Promise.all(keys.map(([key, rule]) => checkRateLimit(db, key, rule, now)));
	const blocked = before.filter((state) => !state.allowed);
	if (blocked.length > 0) {
		return { ok: false, reason: 'locked', retryAfterSeconds: longestWait(blocked) };
	}

	const user = await authenticate(db, credentials.username, credentials.password);
	if (!user) {
		const after = await Promise.all(
			keys.map(([key, rule]) => consumeRateLimit(db, key, rule, now))
		);
		const exhausted = after.filter((state) => state.remaining === 0);
		if (exhausted.length === 0) return { ok: false, reason: 'invalid' };
		await writeAuditLog(db, {
			adminUserId: null,
			action: 'auth.locked',
			entity: 'admin_users',
			metadata: { username: credentials.username.trim() }
		});
		return { ok: false, reason: 'locked', retryAfterSeconds: longestWait(exhausted) };
	}

	await resetRateLimit(db, userKey(credentials.username));
	// Housekeeping piggybacks on logins: no cron needed for a site this size.
	await Promise.all([deleteExpiredSessions(db, now), deleteExpiredRateLimits(db, now)]);
	return { ok: true, user };
}

const longestWait = (states: { retryAfterSeconds: number }[]) =>
	Math.max(...states.map((state) => state.retryAfterSeconds));
