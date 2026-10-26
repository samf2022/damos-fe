// Fixed-window rate limiting stored in D1 (no paid KV or Durable Objects needed).
import { nowIso, type Db } from './db.ts';

export interface RateLimitRule {
	/** Attempts allowed per window. */
	limit: number;
	windowMs: number;
}

export interface RateLimitResult {
	/** Whether the attempt (checked or consumed) is within the limit. */
	allowed: boolean;
	/** Attempts left in the current window after this call. */
	remaining: number;
	/** Seconds until the window resets (0 when nothing is recorded). */
	retryAfterSeconds: number;
}

function result(rule: RateLimitRule, count: number, resetAt: string | null, now: Date) {
	const retryAfterMs = resetAt ? new Date(resetAt).getTime() - now.getTime() : 0;
	return {
		remaining: Math.max(0, rule.limit - count),
		retryAfterSeconds: Math.max(0, Math.ceil(retryAfterMs / 1000))
	};
}

/** Reads the counter without recording an attempt. Allowed while attempts remain. */
export async function checkRateLimit(
	db: Db,
	key: string,
	rule: RateLimitRule,
	now: Date = new Date()
): Promise<RateLimitResult> {
	const row = await db.first<{ count: number; reset_at: string }>(
		'SELECT count, reset_at FROM rate_limits WHERE key = ? AND reset_at > ?',
		key,
		nowIso(now)
	);
	const state = result(rule, row?.count ?? 0, row?.reset_at ?? null, now);
	return { allowed: state.remaining > 0, ...state };
}

/** Records an attempt (atomically) and says whether it was within the limit. */
export async function consumeRateLimit(
	db: Db,
	key: string,
	rule: RateLimitRule,
	now: Date = new Date()
): Promise<RateLimitResult> {
	const current = nowIso(now);
	const row = await db.first<{ count: number; reset_at: string }>(
		`INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
		 ON CONFLICT (key) DO UPDATE SET
		   count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
		   reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END
		 RETURNING count, reset_at`,
		key,
		nowIso(new Date(now.getTime() + rule.windowMs)),
		current,
		current
	);
	const count = row?.count ?? 1;
	return { allowed: count <= rule.limit, ...result(rule, count, row?.reset_at ?? null, now) };
}

export async function resetRateLimit(db: Db, key: string): Promise<void> {
	await db.run('DELETE FROM rate_limits WHERE key = ?', key);
}

export async function deleteExpiredRateLimits(db: Db, now: Date = new Date()): Promise<number> {
	return db.run('DELETE FROM rate_limits WHERE reset_at <= ?', nowIso(now));
}
