import { error } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import type { CertificateRow } from '#lib/server/db.ts';
import { es } from '#lib/i18n/es.ts';
import type { ResidentSnapshot } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

type VerificationRow = Pick<
	CertificateRow,
	'status' | 'issued_at' | 'expires_at' | 'resident_snapshot'
> & {
	type_title: string;
};

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const row = await getDb().first<VerificationRow>(
		`SELECT c.status, c.issued_at, c.expires_at, c.resident_snapshot, t.title AS type_title
		   FROM certificates c
		   JOIN certificate_types t ON t.id = c.certificate_type_id
		  WHERE c.verification_code = ?`,
		params.code
	);
	if (!row) error(404, es.verify.notFound);

	setHeaders({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });

	// Only the holder's name leaves the server: never the national id or other personal data.
	const snapshot = JSON.parse(row.resident_snapshot) as ResidentSnapshot;
	const isApproved = row.status === 'approved' && row.expires_at !== null;
	const isExpired = isApproved && new Date(row.expires_at!) <= new Date();

	return {
		holderName: `${snapshot.firstNames} ${snapshot.lastNames}`,
		typeTitle: row.type_title,
		status: row.status,
		issuedAt: row.issued_at,
		expiresAt: row.expires_at,
		validity: !isApproved ? 'not_issued' : isExpired ? 'expired' : 'valid'
	} as const;
};
