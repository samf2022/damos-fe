import { getDb } from '#lib/server/bindings.ts';
import type { CertificateStatus } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await getDb().all<{ status: CertificateStatus; total: number }>(
		'SELECT status, count(*) AS total FROM certificates GROUP BY status'
	);
	const counts: Record<CertificateStatus, number> = { pending: 0, approved: 0, rejected: 0 };
	for (const row of rows) counts[row.status] = row.total;
	return { counts };
};
