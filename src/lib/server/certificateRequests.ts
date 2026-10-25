import type { ResidentSnapshot } from '#lib/types.ts';
import type { CertificateRequestInput } from '#lib/validation/certificateRequest.ts';
import { newId, nowIso, type Db } from './db.ts';

export type SubmitResult =
	| { ok: true; certificateId: string }
	| { ok: false; reason: 'type_unavailable' | 'duplicate_pending' };

/**
 * Stores a public certificate request as `pending`.
 *
 * - Creates the resident if the national id is new. An existing resident is NOT modified:
 *   the public form is unauthenticated, so anyone knowing a cédula could otherwise overwrite
 *   someone else's record. What the citizen typed is kept in `resident_snapshot` for review.
 * - Rejects a second pending request of the same type for the same national id.
 */
export async function submitCertificateRequest(
	db: Db,
	input: CertificateRequestInput,
	now: Date = new Date()
): Promise<SubmitResult> {
	const type = await db.first<{ id: string }>(
		'SELECT id FROM certificate_types WHERE id = ? AND is_active = 1',
		input.certificateTypeId
	);
	if (!type) return { ok: false, reason: 'type_unavailable' };

	const duplicate = await db.first<{ id: string }>(
		`SELECT c.id FROM certificates c
		   JOIN residents r ON r.id = c.resident_id
		  WHERE r.national_id = ? AND c.certificate_type_id = ? AND c.status = 'pending'`,
		input.nationalId,
		input.certificateTypeId
	);
	if (duplicate) return { ok: false, reason: 'duplicate_pending' };

	const snapshot: ResidentSnapshot = {
		nationalId: input.nationalId,
		firstNames: input.firstNames,
		lastNames: input.lastNames,
		gender: input.gender,
		maritalStatus: input.maritalStatus,
		occupation: input.occupation,
		streetAddress: input.streetAddress,
		houseNumber: input.houseNumber,
		phone: input.phone
	};
	const certificateId = newId();
	const timestamp = nowIso(now);

	// One atomic batch: the resident insert is a no-op if the national id already exists,
	// and the certificate looks the resident up by national id either way.
	await db.batch([
		db.prepare(
			`INSERT INTO residents (id, national_id, first_names, last_names, gender, marital_status,
			                        occupation, street_address, house_number, phone, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (national_id) DO NOTHING`,
			newId(),
			input.nationalId,
			input.firstNames,
			input.lastNames,
			input.gender,
			input.maritalStatus,
			input.occupation,
			input.streetAddress,
			input.houseNumber,
			input.phone,
			timestamp,
			timestamp
		),
		db.prepare(
			`INSERT INTO certificates (id, resident_id, certificate_type_id, status, known_since_text,
			                           resident_snapshot, submitted_at, created_at, updated_at)
			 VALUES (?, (SELECT id FROM residents WHERE national_id = ?), ?, 'pending', ?, ?, ?, ?, ?)`,
			certificateId,
			input.nationalId,
			input.certificateTypeId,
			input.knownSinceText,
			JSON.stringify(snapshot),
			timestamp,
			timestamp,
			timestamp
		),
		db.prepare(
			`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
			 VALUES (?, NULL, 'certificate.submitted', 'certificates', ?, ?, ?)`,
			newId(),
			certificateId,
			JSON.stringify({ certificateTypeId: input.certificateTypeId }),
			timestamp
		)
	]);

	return { ok: true, certificateId };
}
