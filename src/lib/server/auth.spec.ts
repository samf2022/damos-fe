import { beforeEach, describe, expect, it } from 'vitest';
import {
	authenticate,
	createSession,
	deleteExpiredSessions,
	hashPassword,
	invalidateSession,
	invalidateUserSessions,
	SESSION_DURATION_MS,
	sessionIdFromToken,
	validateSession,
	verifyPassword
} from './auth';
import { createDb, type Db, type SessionRow } from './db';
import { createMemoryD1 } from './testing/memoryD1';

const DAY = 24 * 60 * 60 * 1000;

describe('password hashing', () => {
	it('verifies the right password and rejects a wrong one', async () => {
		const stored = await hashPassword('correct horse battery staple');
		expect(stored.hash).toMatch(/^pbkdf2-sha256\$100000\$/);
		expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
		expect(await verifyPassword('Correct horse battery staple', stored)).toBe(false);
	});

	it('uses a random salt per hash', async () => {
		const a = await hashPassword('same');
		const b = await hashPassword('same');
		expect(a.salt).not.toBe(b.salt);
		expect(a.hash).not.toBe(b.hash);
	});

	it('rejects malformed stored hashes', async () => {
		const stored = await hashPassword('x');
		expect(await verifyPassword('x', { ...stored, hash: 'md5$1$abc' })).toBe(false);
		expect(await verifyPassword('x', { ...stored, hash: 'pbkdf2-sha256$abc$abc' })).toBe(false);
		expect(await verifyPassword('x', { ...stored, salt: '%%%' })).toBe(false);
	});
});

describe('sessions', () => {
	let db: Db;
	const userId = 'user-1';

	beforeEach(async () => {
		db = createDb(createMemoryD1());
		const { hash, salt } = await hashPassword('secreto123');
		await db.run(
			`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role)
			 VALUES (?, 'admin', 'Administrador', ?, ?, 'admin')`,
			userId,
			hash,
			salt
		);
	});

	it('stores only the token hash and validates the token', async () => {
		const { token, sessionId } = await createSession(db, userId);
		expect(sessionId).toBe(await sessionIdFromToken(token));

		const stored = await db.first<SessionRow>('SELECT * FROM sessions');
		expect(stored?.id).toBe(sessionId);
		expect(stored?.id).not.toBe(token);

		const result = await validateSession(db, token);
		expect(result?.user).toEqual({
			id: userId,
			username: 'admin',
			displayName: 'Administrador',
			role: 'admin'
		});
		expect(result?.renewed).toBe(false);
	});

	it('rejects unknown tokens', async () => {
		expect(await validateSession(db, 'not-a-token')).toBeNull();
	});

	it('expires and deletes old sessions', async () => {
		const start = new Date('2026-01-01T00:00:00Z');
		const { token } = await createSession(db, userId, start);
		const later = new Date(start.getTime() + SESSION_DURATION_MS + 1);

		expect(await validateSession(db, token, later)).toBeNull();
		expect(await db.first('SELECT * FROM sessions')).toBeNull();
	});

	it('extends sessions close to expiry', async () => {
		const start = new Date('2026-01-01T00:00:00Z');
		const { token } = await createSession(db, userId, start);
		const nearExpiry = new Date(start.getTime() + 20 * DAY);

		const result = await validateSession(db, token, nearExpiry);
		expect(result?.renewed).toBe(true);
		expect(result?.expiresAt.getTime()).toBe(nearExpiry.getTime() + SESSION_DURATION_MS);
	});

	it('rejects sessions of deactivated users', async () => {
		const { token } = await createSession(db, userId);
		await db.run('UPDATE admin_users SET is_active = 0 WHERE id = ?', userId);
		expect(await validateSession(db, token)).toBeNull();
	});

	it('invalidates one session or all sessions of a user', async () => {
		const a = await createSession(db, userId);
		const b = await createSession(db, userId);

		await invalidateSession(db, a.sessionId);
		expect(await validateSession(db, a.token)).toBeNull();
		expect(await validateSession(db, b.token)).not.toBeNull();

		await invalidateUserSessions(db, userId);
		expect(await validateSession(db, b.token)).toBeNull();
	});

	it('cleans up expired sessions', async () => {
		await createSession(db, userId, new Date('2020-01-01T00:00:00Z'));
		await createSession(db, userId);
		expect(await deleteExpiredSessions(db)).toBe(1);
	});
});

describe('authenticate', () => {
	let db: Db;

	beforeEach(async () => {
		db = createDb(createMemoryD1());
		const { hash, salt } = await hashPassword('secreto123');
		await db.run(
			`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role, is_active)
			 VALUES ('u1', 'Maria', 'María', ?, ?, 'reviewer', 1),
			        ('u2', 'inactive', 'Inactivo', ?, ?, 'reviewer', 0)`,
			hash,
			salt,
			hash,
			salt
		);
	});

	it('accepts valid credentials, case-insensitive username', async () => {
		expect((await authenticate(db, ' maria ', 'secreto123'))?.id).toBe('u1');
	});

	it('rejects wrong passwords, unknown and inactive users', async () => {
		expect(await authenticate(db, 'maria', 'otra')).toBeNull();
		expect(await authenticate(db, 'nadie', 'secreto123')).toBeNull();
		expect(await authenticate(db, 'inactive', 'secreto123')).toBeNull();
	});
});
