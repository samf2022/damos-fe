import { renderCertificateBody } from '#lib/certificates/renderCertificateBody.ts';
import { VENEZUELA_TIME_ZONE } from '#lib/text/dateToSpanishWords.ts';
import type { ResidentSnapshot } from '#lib/types.ts';
import {
	newId,
	nowIso,
	type CertificateRow,
	type CouncilSettingsRow,
	type Db,
	type SignerRow
} from './db.ts';

/** No 0/O or 1/I, so codes can be read aloud or typed from paper. 32 symbols → no modulo bias. */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 10;

export function generateVerificationCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
	return [...bytes].map((byte) => CODE_ALPHABET[byte & 31]).join('');
}

/** Adds calendar months, clamping to the end of the month (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	const day = result.getUTCDate();
	result.setUTCDate(1);
	result.setUTCMonth(result.getUTCMonth() + months);
	const lastDay = new Date(
		Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
	).getUTCDate();
	result.setUTCDate(Math.min(day, lastDay));
	return result;
}

function yearInVenezuela(date: Date): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: VENEZUELA_TIME_ZONE,
		year: 'numeric'
	}).format(date);
}

export type ReviewSigner = Pick<
	SignerRow,
	'id' | 'full_name' | 'short_name' | 'role_title' | 'phone' | 'gender'
> & {
	/** Default signer for this certificate type. */
	is_default: 0 | 1;
	display_order: number;
};

export interface ReviewData {
	certificate: CertificateRow & {
		type_title: string;
		type_template: string;
		reviewer_name: string | null;
	};
	snapshot: ResidentSnapshot;
	/** Current resident record, to compare with what was submitted. */
	resident: ResidentSnapshot;
	council: CouncilSettingsRow | null;
	/** Active signers, defaults of the type first. */
	signers: ReviewSigner[];
	/** Signers frozen at approval time. */
	issuedSigners: { full_name: string; short_name: string; role_title: string }[];
}

export async function getReviewData(db: Db, certificateId: string): Promise<ReviewData | null> {
	const certificate = await db.first<ReviewData['certificate']>(
		`SELECT c.*, t.title AS type_title, t.body_template AS type_template,
		        u.display_name AS reviewer_name
		   FROM certificates c
		   JOIN certificate_types t ON t.id = c.certificate_type_id
		   LEFT JOIN admin_users u ON u.id = c.reviewed_by
		  WHERE c.id = ?`,
		certificateId
	);
	if (!certificate) return null;

	const [residentRow, council, signers, issuedSigners] = await Promise.all([
		db.first<{
			national_id: string;
			first_names: string;
			last_names: string;
			gender: ResidentSnapshot['gender'];
			marital_status: string | null;
			occupation: string | null;
			street_address: string;
			house_number: string | null;
			phone: string | null;
		}>('SELECT * FROM residents WHERE id = ?', certificate.resident_id),
		db.first<CouncilSettingsRow>('SELECT * FROM council_settings LIMIT 1'),
		db.all<ReviewSigner>(
			`SELECT s.id, s.full_name, s.short_name, s.role_title, s.phone, s.gender,
			        CASE WHEN cts.signer_id IS NULL THEN 0 ELSE 1 END AS is_default,
			        COALESCE(cts.display_order, 1000 + s.display_order) AS display_order
			   FROM signers s
			   LEFT JOIN certificate_type_signers cts
			     ON cts.signer_id = s.id AND cts.certificate_type_id = ?
			  WHERE s.is_active = 1
			  ORDER BY display_order`,
			certificate.certificate_type_id
		),
		db.all<ReviewData['issuedSigners'][number]>(
			`SELECT full_name, short_name, role_title FROM certificate_signers
			  WHERE certificate_id = ? ORDER BY display_order`,
			certificateId
		)
	]);

	const snapshot = JSON.parse(certificate.resident_snapshot) as ResidentSnapshot;
	const resident: ResidentSnapshot = residentRow
		? {
				nationalId: residentRow.national_id,
				firstNames: residentRow.first_names,
				lastNames: residentRow.last_names,
				gender: residentRow.gender,
				maritalStatus: residentRow.marital_status,
				occupation: residentRow.occupation,
				streetAddress: residentRow.street_address,
				houseNumber: residentRow.house_number,
				phone: residentRow.phone
			}
		: snapshot;

	return { certificate, snapshot, resident, council, signers, issuedSigners };
}

export type ReviewFailure =
	'not_found' | 'already_reviewed' | 'no_signers' | 'no_council' | 'template_incomplete';

export async function approveCertificate(
	db: Db,
	input: {
		certificateId: string;
		reviewerId: string;
		signerIds: string[];
		knownSinceText: string;
		updateResident: boolean;
		now?: Date;
	}
): Promise<
	| { ok: true; serialNumber: string; verificationCode: string }
	| { ok: false; reason: ReviewFailure; missing?: string[] }
> {
	const now = input.now ?? new Date();
	const data = await getReviewData(db, input.certificateId);
	if (!data) return { ok: false, reason: 'not_found' };
	if (data.certificate.status !== 'pending') return { ok: false, reason: 'already_reviewed' };
	if (!data.council) return { ok: false, reason: 'no_council' };

	const signers = data.signers.filter((signer) => input.signerIds.includes(signer.id));
	if (signers.length === 0) return { ok: false, reason: 'no_signers' };

	const issuedAt = nowIso(now);
	const { body, missing } = renderCertificateBody({
		template: data.certificate.type_template,
		council: data.council,
		resident: data.snapshot,
		signerGenders: signers.map((signer) => signer.gender),
		knownSinceText: input.knownSinceText,
		issuedAt
	});
	if (missing.length > 0) return { ok: false, reason: 'template_incomplete', missing };

	const verificationCode = generateVerificationCode();
	const expiresAt = nowIso(addMonths(now, data.council.validity_months));
	const year = yearInVenezuela(now);
	// Statements after the UPDATE only run their effect if it actually approved this row,
	// which they detect through the verification code we just generated.
	const approvedHere = 'SELECT 1 FROM certificates WHERE id = ? AND verification_code = ?';

	const statements = [
		db.prepare(
			`UPDATE certificates SET
			   status = 'approved',
			   serial_number = (
			     SELECT ? || '-' || printf('%04d', COALESCE(MAX(CAST(substr(serial_number, 6) AS INTEGER)), 0) + 1)
			       FROM certificates WHERE serial_number LIKE ? || '-%'
			   ),
			   verification_code = ?, rendered_body = ?, known_since_text = ?,
			   issued_at = ?, expires_at = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
			 WHERE id = ? AND status = 'pending'`,
			year,
			year,
			verificationCode,
			body,
			input.knownSinceText,
			issuedAt,
			expiresAt,
			issuedAt,
			input.reviewerId,
			issuedAt,
			input.certificateId
		),
		...signers.map((signer, index) =>
			db.prepare(
				`INSERT INTO certificate_signers
				   (certificate_id, signer_id, full_name, short_name, role_title, phone, display_order)
				 SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (${approvedHere})`,
				input.certificateId,
				signer.id,
				signer.full_name,
				signer.short_name,
				signer.role_title,
				signer.phone,
				index + 1,
				input.certificateId,
				verificationCode
			)
		),
		db.prepare(
			`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
			 SELECT ?, ?, 'certificate.approved', 'certificates', ?, ?, ? WHERE EXISTS (${approvedHere})`,
			newId(),
			input.reviewerId,
			input.certificateId,
			JSON.stringify({ signerIds: signers.map((s) => s.id), updateResident: input.updateResident }),
			issuedAt,
			input.certificateId,
			verificationCode
		)
	];

	if (input.updateResident) {
		const s = data.snapshot;
		statements.push(
			db.prepare(
				`UPDATE residents SET first_names = ?, last_names = ?, gender = ?, marital_status = ?,
				        occupation = ?, street_address = ?, house_number = ?, phone = ?, updated_at = ?
				  WHERE id = ? AND EXISTS (${approvedHere})`,
				s.firstNames,
				s.lastNames,
				s.gender,
				s.maritalStatus,
				s.occupation,
				s.streetAddress,
				s.houseNumber,
				s.phone,
				issuedAt,
				data.certificate.resident_id,
				input.certificateId,
				verificationCode
			)
		);
	}

	await db.batch(statements);

	const result = await db.first<{ serial_number: string | null; verification_code: string | null }>(
		'SELECT serial_number, verification_code FROM certificates WHERE id = ?',
		input.certificateId
	);
	if (result?.verification_code !== verificationCode || !result.serial_number) {
		// Someone else reviewed it between our read and our write.
		return { ok: false, reason: 'already_reviewed' };
	}
	return { ok: true, serialNumber: result.serial_number, verificationCode };
}

export async function rejectCertificate(
	db: Db,
	input: { certificateId: string; reviewerId: string; reason: string; now?: Date }
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'already_reviewed' }> {
	const timestamp = nowIso(input.now ?? new Date());
	const changes = await db.run(
		`UPDATE certificates SET status = 'rejected', rejection_reason = ?, reviewed_at = ?,
		        reviewed_by = ?, updated_at = ?
		  WHERE id = ? AND status = 'pending'`,
		input.reason,
		timestamp,
		input.reviewerId,
		timestamp,
		input.certificateId
	);
	if (changes === 0) {
		const exists = await db.first('SELECT 1 FROM certificates WHERE id = ?', input.certificateId);
		return { ok: false, reason: exists ? 'already_reviewed' : 'not_found' };
	}
	await db.run(
		`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
		 VALUES (?, ?, 'certificate.rejected', 'certificates', ?, ?, ?)`,
		newId(),
		input.reviewerId,
		input.certificateId,
		JSON.stringify({ reason: input.reason }),
		timestamp
	);
	return { ok: true };
}
