import type { Cookies } from '@sveltejs/kit';
import type { AdminRole } from '#lib/types.ts';
import { newId, nowIso, type AdminUserRow, type Db } from './db.ts';
import { hashPassword, verifyPassword } from './password.ts';

export { hashPassword, verifyPassword };

export const SESSION_COOKIE_NAME = 'damos_fe_session';
// `secure` is left to SvelteKit's default: true in production, false only in dev and on
// http://localhost (where browsers like Safari would otherwise drop the cookie).
const SESSION_COOKIE_OPTIONS = { path: '/', httpOnly: true, sameSite: 'lax' } as const;
const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_DURATION_MS = 30 * DAY_MS;
/** Sessions with less than this left are extended on use (sliding expiration). */
const SESSION_RENEW_THRESHOLD_MS = 15 * DAY_MS;

export interface SessionUser {
	id: string;
	username: string;
	displayName: string;
	role: AdminRole;
}

export interface SessionValidation {
	sessionId: string;
	user: SessionUser;
	expiresAt: Date;
	/** True when the expiry was extended and the cookie must be re-sent. */
	renewed: boolean;
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Random token stored only in the cookie. */
function generateSessionToken(): string {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** Session ids in D1 are SHA-256 hashes of the token, so a DB leak doesn't expose live sessions. */
export async function sessionIdFromToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSession(
	db: Db,
	adminUserId: string,
	now: Date = new Date()
): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
	const token = generateSessionToken();
	const sessionId = await sessionIdFromToken(token);
	const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
	await db.run(
		'INSERT INTO sessions (id, admin_user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
		sessionId,
		adminUserId,
		nowIso(expiresAt),
		nowIso(now)
	);
	return { token, sessionId, expiresAt };
}

type SessionWithUser = Pick<AdminUserRow, 'username' | 'display_name' | 'role' | 'is_active'> & {
	session_id: string;
	admin_user_id: string;
	expires_at: string;
};

export async function validateSession(
	db: Db,
	token: string,
	now: Date = new Date()
): Promise<SessionValidation | null> {
	const sessionId = await sessionIdFromToken(token);
	const row = await db.first<SessionWithUser>(
		`SELECT s.id AS session_id, s.admin_user_id, s.expires_at,
		        u.username, u.display_name, u.role, u.is_active
		   FROM sessions s
		   JOIN admin_users u ON u.id = s.admin_user_id
		  WHERE s.id = ?`,
		sessionId
	);
	if (!row) return null;

	let expiresAt = new Date(row.expires_at);
	if (now >= expiresAt || row.is_active !== 1) {
		await db.run('DELETE FROM sessions WHERE id = ?', sessionId);
		return null;
	}

	let renewed = false;
	if (expiresAt.getTime() - now.getTime() < SESSION_RENEW_THRESHOLD_MS) {
		expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
		await db.run('UPDATE sessions SET expires_at = ? WHERE id = ?', nowIso(expiresAt), sessionId);
		renewed = true;
	}

	return {
		sessionId,
		expiresAt,
		renewed,
		user: {
			id: row.admin_user_id,
			username: row.username,
			displayName: row.display_name,
			role: row.role
		}
	};
}

export async function invalidateSession(db: Db, sessionId: string): Promise<void> {
	await db.run('DELETE FROM sessions WHERE id = ?', sessionId);
}

/** Logs a user out everywhere, e.g. after a password change or deactivation. */
export async function invalidateUserSessions(db: Db, adminUserId: string): Promise<void> {
	await db.run('DELETE FROM sessions WHERE admin_user_id = ?', adminUserId);
}

export async function deleteExpiredSessions(db: Db, now: Date = new Date()): Promise<number> {
	return db.run('DELETE FROM sessions WHERE expires_at <= ?', nowIso(now));
}

/** Returns the active user if the credentials are valid. */
export async function authenticate(
	db: Db,
	username: string,
	password: string
): Promise<SessionUser | null> {
	const user = await db.first<AdminUserRow>(
		'SELECT * FROM admin_users WHERE username = ? AND is_active = 1',
		username.trim()
	);
	if (!user) {
		// Hash anyway so response time doesn't reveal whether the username exists.
		await hashPassword(password);
		return null;
	}
	const valid = await verifyPassword(password, {
		hash: user.password_hash,
		salt: user.password_salt
	});
	if (!valid) return null;
	return { id: user.id, username: user.username, displayName: user.display_name, role: user.role };
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTIONS, expires: expiresAt });
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
}

export async function writeAuditLog(
	db: Db,
	entry: {
		adminUserId: string | null;
		action: string;
		entity: string;
		entityId?: string | null;
		metadata?: Record<string, unknown>;
	}
): Promise<void> {
	await db.run(
		`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		newId(),
		entry.adminUserId,
		entry.action,
		entry.entity,
		entry.entityId ?? null,
		entry.metadata ? JSON.stringify(entry.metadata) : null,
		nowIso()
	);
}
