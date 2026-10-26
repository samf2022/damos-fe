import { beforeEach, describe, expect, it } from 'vitest';
import { createSession } from './auth';
import { createDb, type Db } from './db';
import { attemptLogin, LOGIN_LIMITS } from './loginThrottle';
import { insertAdminUser, minutesAfter } from './testing/fixtures';
import { createMemoryD1 } from './testing/memoryD1';

const T0 = new Date('2026-10-25T12:00:00.000Z');
const PASSWORD = 'clave-de-prueba-123';

let db: Db;
let userId: string;
beforeEach(async () => {
	db = createDb(createMemoryD1());
	userId = await insertAdminUser(db, { username: 'operadora', password: PASSWORD });
});

const login = (password: string, options: { ip?: string; username?: string; at?: Date } = {}) =>
	attemptLogin(
		db,
		{ username: options.username ?? 'operadora', password, ip: options.ip ?? '198.51.100.7' },
		options.at ?? T0
	);

async function failTimes(n: number, options: Parameters<typeof login>[1] = {}) {
	const results = [];
	for (let i = 0; i < n; i++) results.push(await login('incorrecta', options));
	return results;
}

describe('attemptLogin', () => {
	it('logs in with the right password', async () => {
		const result = await login(PASSWORD);
		expect(result).toMatchObject({ ok: true, user: { id: userId, username: 'operadora' } });
	});

	it('locks the account after the 5th failure, even for the right password', async () => {
		const results = await failTimes(LOGIN_LIMITS.user.limit);
		expect(results.slice(0, 4).map((r) => r.ok || r.reason)).toEqual(Array(4).fill('invalid'));
		expect(results[4]).toEqual({ ok: false, reason: 'locked', retryAfterSeconds: 15 * 60 });
		expect(await login(PASSWORD, { at: minutesAfter(T0, 5) })).toEqual({
			ok: false,
			reason: 'locked',
			retryAfterSeconds: 10 * 60
		});
		const audit = await db.all<{ metadata: string }>(
			"SELECT metadata FROM audit_logs WHERE action = 'auth.locked'"
		);
		expect(audit).toEqual([{ metadata: '{"username":"operadora"}' }]);
	});

	it('unlocks when the window passes', async () => {
		await failTimes(LOGIN_LIMITS.user.limit);
		const result = await login(PASSWORD, { at: minutesAfter(T0, 15) });
		expect(result.ok).toBe(true);
	});

	it('treats usernames case-insensitively and locks the account from any IP', async () => {
		await failTimes(LOGIN_LIMITS.user.limit, { username: ' OPERADORA ' });
		const result = await login(PASSWORD, { ip: '203.0.113.99' });
		expect(result).toMatchObject({ ok: false, reason: 'locked' });
	});

	it('forgets earlier failures after a successful login', async () => {
		await failTimes(4);
		expect((await login(PASSWORD)).ok).toBe(true);
		const results = await failTimes(4);
		expect(results.every((r) => !r.ok && r.reason === 'invalid')).toBe(true);
	});

	it('limits one IP trying many usernames, without locking those accounts elsewhere', async () => {
		for (let i = 0; i < LOGIN_LIMITS.ip.limit; i++) {
			await login('x', { username: `usuario${i}` });
		}
		expect(await login(PASSWORD)).toMatchObject({ ok: false, reason: 'locked' });
		expect((await login(PASSWORD, { ip: '203.0.113.99' })).ok).toBe(true);
	});

	it('counts unknown usernames too', async () => {
		const results = await failTimes(LOGIN_LIMITS.user.limit, { username: 'nadie' });
		expect(results.at(-1)).toMatchObject({ ok: false, reason: 'locked' });
	});

	it('cleans up expired sessions and stale counters on success', async () => {
		await createSession(db, userId, new Date('2026-01-01T00:00:00.000Z'));
		await failTimes(1, { username: 'otra', at: minutesAfter(T0, -60) });
		expect((await login(PASSWORD)).ok).toBe(true);
		const sessions = await db.first<{ n: number }>('SELECT count(*) AS n FROM sessions');
		const counters = await db.all<{ key: string }>('SELECT key FROM rate_limits ORDER BY key');
		expect(sessions?.n).toBe(0);
		expect(counters).toEqual([]);
	});
});
