import { getDb } from '#lib/server/bindings.ts';
import { usesSampleData } from '#lib/server/councilSettings.ts';
import type { CertificateStatus } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = getDb();
	const [rows, sampleData] = await Promise.all([
		db.all<{ status: CertificateStatus; total: number }>(
			'SELECT status, count(*) AS total FROM certificates GROUP BY status'
		),
		usesSampleData(db)
	]);
	const counts: Record<CertificateStatus, number> = { pending: 0, approved: 0, rejected: 0 };
	for (const row of rows) counts[row.status] = row.total;
	return { counts, sampleData };
};
