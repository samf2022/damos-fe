import { getDb } from '#lib/server/bindings.ts';
import type { CertificateTypeRow } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	certificateTypes: await getDb().all<Pick<CertificateTypeRow, 'code' | 'title'>>(
		'SELECT code, title FROM certificate_types WHERE is_active = 1 ORDER BY title'
	)
});
