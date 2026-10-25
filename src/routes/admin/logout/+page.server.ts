import { redirect } from '@sveltejs/kit';
import { deleteSessionCookie, invalidateSession, writeAuditLog } from '#lib/server/auth.ts';
import { getDb } from '#lib/server/bindings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/admin');

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.sessionId) {
			const db = getDb();
			await invalidateSession(db, locals.sessionId);
			await writeAuditLog(db, {
				adminUserId: locals.user?.id ?? null,
				action: 'auth.logout',
				entity: 'admin_users',
				entityId: locals.user?.id ?? null
			});
		}
		deleteSessionCookie(cookies);
		redirect(303, '/admin/login');
	}
};
