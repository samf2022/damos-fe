import { getDb } from '#lib/server/bindings.ts';
import type { CertificateRow, CertificateStatus, SqlValue } from '#lib/server/db.ts';
import { normalizeNationalId } from '#lib/validation/certificateRequest.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 25;
const STATUSES = ['pending', 'approved', 'rejected'] as const;
type StatusFilter = CertificateStatus | 'all';

export const load: PageServerLoad = async ({ url }) => {
	const db = getDb();
	const statusParam = url.searchParams.get('status');
	const status: StatusFilter =
		statusParam === 'all' || STATUSES.includes(statusParam as CertificateStatus)
			? (statusParam as StatusFilter)
			: 'pending';
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

	const where: string[] = [];
	const params: SqlValue[] = [];
	if (status !== 'all') {
		where.push('c.status = ?');
		params.push(status);
	}
	if (q) {
		const nationalId = normalizeNationalId(q);
		if (nationalId) {
			where.push('r.national_id = ?');
			params.push(nationalId);
		} else {
			where.push(`(r.first_names || ' ' || r.last_names) LIKE ?`);
			params.push(`%${q.replace(/[%_]/g, '')}%`);
		}
	}
	const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
	// The review queue is first-come, first-served; history reads newest first.
	const order = status === 'pending' ? 'ASC' : 'DESC';

	const [rows, total, counts] = await Promise.all([
		db.all<
			Pick<CertificateRow, 'id' | 'status' | 'submitted_at' | 'serial_number'> & {
				resident_name: string;
				national_id: string;
				type_title: string;
			}
		>(
			`SELECT c.id, c.status, c.submitted_at, c.serial_number, r.national_id,
			        r.first_names || ' ' || r.last_names AS resident_name, t.title AS type_title
			   FROM certificates c
			   JOIN residents r ON r.id = c.resident_id
			   JOIN certificate_types t ON t.id = c.certificate_type_id
			   ${whereSql}
			  ORDER BY c.submitted_at ${order}
			  LIMIT ? OFFSET ?`,
			...params,
			PAGE_SIZE,
			(page - 1) * PAGE_SIZE
		),
		db.first<{ n: number }>(
			`SELECT count(*) AS n FROM certificates c JOIN residents r ON r.id = c.resident_id ${whereSql}`,
			...params
		),
		db.all<{ status: CertificateStatus; n: number }>(
			'SELECT status, count(*) AS n FROM certificates GROUP BY status'
		)
	]);

	const countByStatus = { pending: 0, approved: 0, rejected: 0, all: 0 };
	for (const row of counts) {
		countByStatus[row.status] = row.n;
		countByStatus.all += row.n;
	}

	return {
		certificates: rows,
		filters: { status, q },
		counts: countByStatus,
		page,
		pageCount: Math.max(1, Math.ceil((total?.n ?? 0) / PAGE_SIZE))
	};
};
