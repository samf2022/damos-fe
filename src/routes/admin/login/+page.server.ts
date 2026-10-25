import { fail, redirect } from '@sveltejs/kit';
import { authenticate, createSession, setSessionCookie, writeAuditLog } from '#lib/server/auth.ts';
import { getDb } from '#lib/server/bindings.ts';
import { es } from '#lib/i18n/es.ts';
import type { Actions, PageServerLoad } from './$types';

/** Only allow same-site relative redirects to avoid open redirects. */
function safeRedirectTarget(value: string | null): string {
	return value && value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		if (!username || !password) {
			return fail(400, { username, message: es.login.missingFields });
		}

		const db = getDb();
		const user = await authenticate(db, username, password);
		if (!user) {
			// TODO: rate-limit failed attempts (e.g. per IP and username).
			return fail(400, { username, message: es.login.invalidCredentials });
		}

		const session = await createSession(db, user.id);
		setSessionCookie(cookies, session.token, session.expiresAt);
		await writeAuditLog(db, {
			adminUserId: user.id,
			action: 'auth.login',
			entity: 'admin_users',
			entityId: user.id
		});

		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
};
