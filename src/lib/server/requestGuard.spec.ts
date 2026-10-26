import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { guardPublicRequest, REQUEST_LIMIT } from './requestGuard';
import { fakeTurnstile } from './testing/fakeTurnstile';
import { minutesAfter } from './testing/fixtures';
import { createMemoryD1 } from './testing/memoryD1';

const T0 = new Date('2026-10-25T12:00:00.000Z');
const TURNSTILE = { siteKey: 'site', secretKey: 'secret' };

let db: Db;
beforeEach(() => {
	db = createDb(createMemoryD1());
});

describe('guardPublicRequest', () => {
	it('passes a human within the limit', async () => {
		const { fetcher, calls } = fakeTurnstile('success');
		const result = await guardPublicRequest(
			db,
			{ ip: '198.51.100.7', turnstileToken: 'tok', turnstile: TURNSTILE, fetcher },
			T0
		);
		expect(result).toEqual({ ok: true });
		expect(calls[0].form.remoteip).toBe('198.51.100.7');
	});

	it('rejects a failed CAPTCHA', async () => {
		const { fetcher } = fakeTurnstile('failure');
		const result = await guardPublicRequest(
			db,
			{ ip: '198.51.100.7', turnstileToken: 'tok', turnstile: TURNSTILE, fetcher },
			T0
		);
		expect(result).toEqual({ ok: false, reason: 'captcha' });
	});

	it('only rate-limits while Turnstile is not configured', async () => {
		const { fetcher, calls } = fakeTurnstile('failure');
		const input = { ip: '198.51.100.7', turnstileToken: null, turnstile: null, fetcher };
		expect(await guardPublicRequest(db, input, T0)).toEqual({ ok: true });
		expect(calls).toHaveLength(0);
	});

	it('blocks a connection over the hourly limit, before asking Cloudflare', async () => {
		const { fetcher, calls } = fakeTurnstile('success');
		const input = { ip: '198.51.100.7', turnstileToken: 'tok', turnstile: TURNSTILE, fetcher };
		for (let i = 0; i < REQUEST_LIMIT.limit; i++) {
			expect((await guardPublicRequest(db, input, T0)).ok).toBe(true);
		}
		expect(await guardPublicRequest(db, input, T0)).toEqual({ ok: false, reason: 'rate_limited' });
		expect(calls).toHaveLength(REQUEST_LIMIT.limit);
		expect((await guardPublicRequest(db, { ...input, ip: '203.0.113.5' }, T0)).ok).toBe(true);
		expect((await guardPublicRequest(db, input, minutesAfter(T0, 60))).ok).toBe(true);
	});

	it('spends the quota on failed CAPTCHAs too', async () => {
		const { fetcher } = fakeTurnstile('failure');
		const input = { ip: '198.51.100.7', turnstileToken: 'tok', turnstile: TURNSTILE, fetcher };
		for (let i = 0; i < REQUEST_LIMIT.limit; i++) await guardPublicRequest(db, input, T0);
		expect(await guardPublicRequest(db, input, T0)).toEqual({ ok: false, reason: 'rate_limited' });
	});
});
