import { fail } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import type { CertificateTypeRow } from '#lib/server/db.ts';
import { es } from '#lib/i18n/es.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const certificateTypes = await getDb().all<Pick<CertificateTypeRow, 'id' | 'code' | 'title'>>(
		'SELECT id, code, title FROM certificate_types WHERE is_active = 1 ORDER BY title'
	);
	return { certificateTypes };
};

export const actions: Actions = {
	default: async () => {
		// TODO(next milestone): validate the form, upsert the resident by national_id,
		// insert a `pending` certificate with resident_snapshot, then redirect(303, '/request/sent').
		return fail(501, { message: es.request.notAvailable });
	}
};
