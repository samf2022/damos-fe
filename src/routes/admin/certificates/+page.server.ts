import { getDb } from '#lib/server/bindings.ts';
import type { CertificateRow } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// TODO(next milestone): filters by status/type, search and pagination.
	const certificates = await getDb().all<
		Pick<CertificateRow, 'id' | 'status' | 'submitted_at' | 'serial_number'> & {
			resident_name: string;
			type_title: string;
		}
	>(
		`SELECT c.id, c.status, c.submitted_at, c.serial_number,
		        r.first_names || ' ' || r.last_names AS resident_name, t.title AS type_title
		   FROM certificates c
		   JOIN residents r ON r.id = c.resident_id
		   JOIN certificate_types t ON t.id = c.certificate_type_id
		  ORDER BY c.submitted_at DESC
		  LIMIT 50`
	);
	return { certificates };
};
