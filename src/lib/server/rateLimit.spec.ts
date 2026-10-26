import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import {
	checkRateLimit,
	consumeRateLimit,
	deleteExpiredRateLimits,
	resetRateLimit
} from './rateLimit';
import { minutesAfter } from './testing/fixtures';
import { createMemoryD1 } from './testing/memoryD1';

const RULE = { limit: 3, windowMs: 10 * 60 * 1000 };
const T0 = new Date('2026-10-25T12:00:00.000Z');

let db: Db;
beforeEach(() => {
	db = createDb(createMemoryD1());
});

describe('consumeRateLimit', () => {
	it('allows up to the limit within a window, then blocks', async () => {
		const results = [];
		for (let i = 0; i < 4; i++) results.push(await consumeRateLimit(db, 'k', RULE, T0));
		expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
		expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
		expect(results[3].retryAfterSeconds).toBe(600);
	});

	it('keeps the window start fixed and starts over once it passes', async () => {
		await consumeRateLimit(db, 'k', RULE, T0);
		const later = await consumeRateLimit(db, 'k', RULE, minutesAfter(T0, 4));
		expect(later.retryAfterSeconds).toBe(6 * 60);
		const fresh = await consumeRateLimit(db, 'k', RULE, minutesAfter(T0, 10));
		expect(fresh).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 600 });
	});

	it('counts keys separately', async () => {
		for (let i = 0; i < 3; i++) await consumeRateLimit(db, 'a', RULE, T0);
		expect((await consumeRateLimit(db, 'b', RULE, T0)).remaining).toBe(2);
	});
});

describe('checkRateLimit', () => {
	it('reads without recording', async () => {
		expect(await checkRateLimit(db, 'k', RULE, T0)).toEqual({
			allowed: true,
			remaining: 3,
			retryAfterSeconds: 0
		});
		for (let i = 0; i < 3; i++) await consumeRateLimit(db, 'k', RULE, T0);
		const blocked = await checkRateLimit(db, 'k', RULE, minutesAfter(T0, 1));
		expect(blocked).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 540 });
		expect((await checkRateLimit(db, 'k', RULE, minutesAfter(T0, 10))).allowed).toBe(true);
	});
});

describe('resetRateLimit and deleteExpiredRateLimits', () => {
	it('clears one key, or every stale key', async () => {
		await consumeRateLimit(db, 'a', RULE, T0);
		await consumeRateLimit(db, 'b', RULE, minutesAfter(T0, 5));
		await resetRateLimit(db, 'a');
		expect((await checkRateLimit(db, 'a', RULE, T0)).remaining).toBe(3);

		await consumeRateLimit(db, 'a', RULE, T0);
		expect(await deleteExpiredRateLimits(db, minutesAfter(T0, 10))).toBe(1);
		const left = await db.all<{ key: string }>('SELECT key FROM rate_limits');
		expect(left).toEqual([{ key: 'b' }]);
	});
});
