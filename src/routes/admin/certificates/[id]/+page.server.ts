import { error } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import type { CertificateRow } from '#lib/server/db.ts';
import { es } from '#lib/i18n/es.ts';
import type { ResidentSnapshot } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const certificate = await getDb().first<CertificateRow & { type_title: string }>(
		`SELECT c.*, t.title AS type_title
		   FROM certificates c
		   JOIN certificate_types t ON t.id = c.certificate_type_id
		  WHERE c.id = ?`,
		params.id
	);
	if (!certificate) error(404, es.errors.notFound);

	// TODO(next milestone): approve/reject actions, rendered body preview, PDF generation,
	// print and WhatsApp buttons.
	return {
		certificate,
		resident: JSON.parse(certificate.resident_snapshot) as ResidentSnapshot
	};
};
