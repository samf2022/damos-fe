import { error, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import {
	deleteSessionCookie,
	SESSION_COOKIE_NAME,
	setSessionCookie,
	validateSession
} from '#lib/server/auth.ts';
import { getDb } from '#lib/server/bindings.ts';
import { es } from '#lib/i18n/es.ts';
import type { AdminRole } from '#lib/types.ts';

const LOGIN_PATH = '/admin/login';

/** Admin sections restricted to specific roles. Everything else under /admin needs any session. */
const ROLE_RULES: { prefix: string; roles: AdminRole[] }[] = [
	{ prefix: '/admin/users', roles: ['admin'] },
	{ prefix: '/admin/settings', roles: ['admin'] },
	{ prefix: '/admin/signers', roles: ['admin'] },
	{ prefix: '/admin/certificate-types', roles: ['admin'] }
];

const isUnder = (pathname: string, prefix: string) =>
	pathname === prefix || pathname.startsWith(`${prefix}/`);

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.sessionId = null;

	const token = event.cookies.get(SESSION_COOKIE_NAME);
	if (token) {
		const session = await validateSession(getDb(), token);
		if (session) {
			event.locals.user = session.user;
			event.locals.sessionId = session.sessionId;
			if (session.renewed) setSessionCookie(event.cookies, token, session.expiresAt);
		} else {
			deleteSessionCookie(event.cookies);
		}
	}

	const { pathname, search } = event.url;
	if (isUnder(pathname, '/admin') && !isUnder(pathname, LOGIN_PATH)) {
		const user = event.locals.user;
		if (!user) {
			redirect(303, `${LOGIN_PATH}?redirectTo=${encodeURIComponent(pathname + search)}`);
		}
		const rule = ROLE_RULES.find((r) => isUnder(pathname, r.prefix));
		if (rule && !rule.roles.includes(user.role)) error(403, es.errors.forbidden);
	}

	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	if (isUnder(pathname, '/admin')) response.headers.set('Cache-Control', 'private, no-store');
	return response;
};
