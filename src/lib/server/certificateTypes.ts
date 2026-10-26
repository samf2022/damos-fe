// Certificate types admin: list, load for the editor (with what the live preview needs) and save.
import type { SignerForTemplate } from '#lib/certificates/renderCertificateBody.ts';
import type { CertificateTypeInput } from '#lib/validation/certificateType.ts';
import {
	newId,
	nowIso,
	toDbBoolean,
	type CertificateTypeRow,
	type CouncilSettingsRow,
	type Db
} from './db.ts';

export type CertificateTypeSummary = Pick<
	CertificateTypeRow,
	'id' | 'code' | 'title' | 'is_active' | 'updated_at'
> & { pending_count: number };

export async function listCertificateTypesForAdmin(db: Db): Promise<CertificateTypeSummary[]> {
	return db.all<CertificateTypeSummary>(
		`SELECT t.id, t.code, t.title, t.is_active, t.updated_at,
		        (SELECT count(*) FROM certificates c
		          WHERE c.certificate_type_id = t.id AND c.status = 'pending') AS pending_count
		   FROM certificate_types t
		  ORDER BY t.title`
	);
}

export type PreviewSigner = SignerForTemplate & {
	shortName: string;
	roleTitle: string;
	phone: string | null;
};

export interface CertificateTypeEditorData {
	type: CertificateTypeRow;
	council: CouncilSettingsRow | null;
	/** Active signers for the preview, the type's defaults first. */
	previewSigners: PreviewSigner[];
	/** Pending requests that will be issued with the saved wording. */
	pendingCount: number;
}

export async function getCertificateTypeEditor(
	db: Db,
	id: string
): Promise<CertificateTypeEditorData | null> {
	const type = await db.first<CertificateTypeRow>(
		'SELECT * FROM certificate_types WHERE id = ?',
		id
	);
	if (!type) return null;
	const [council, signers, pending] = await Promise.all([
		db.first<CouncilSettingsRow>('SELECT * FROM council_settings LIMIT 1'),
		db.all<{
			full_name: string;
			national_id: string;
			gender: SignerForTemplate['gender'];
			short_name: string;
			role_title: string;
			phone: string | null;
		}>(
			`SELECT s.full_name, s.national_id, s.gender, s.short_name, s.role_title, s.phone
			   FROM signers s
			   LEFT JOIN certificate_type_signers cts
			     ON cts.signer_id = s.id AND cts.certificate_type_id = ?
			  WHERE s.is_active = 1
			  ORDER BY cts.signer_id IS NULL, COALESCE(cts.display_order, s.display_order)`,
			id
		),
		db.first<{ n: number }>(
			"SELECT count(*) AS n FROM certificates WHERE certificate_type_id = ? AND status = 'pending'",
			id
		)
	]);
	return {
		type,
		council,
		previewSigners: signers.map((s) => ({
			fullName: s.full_name,
			nationalId: s.national_id,
			gender: s.gender,
			shortName: s.short_name,
			roleTitle: s.role_title,
			phone: s.phone
		})),
		pendingCount: pending?.n ?? 0
	};
}

export type SaveCertificateTypeResult =
	{ ok: true } | { ok: false; reason: 'not_found' | 'last_active' };

/**
 * Saves title, wording and availability. Already issued certificates keep their own frozen
 * text; the previous version goes into the audit log so it can be recovered.
 */
export async function saveCertificateType(
	db: Db,
	id: string,
	input: CertificateTypeInput,
	adminUserId: string
): Promise<SaveCertificateTypeResult> {
	const current = await db.first<CertificateTypeRow>(
		'SELECT * FROM certificate_types WHERE id = ?',
		id
	);
	if (!current) return { ok: false, reason: 'not_found' };
	if (current.is_active === 1 && !input.isActive) {
		const others = await db.first<{ n: number }>(
			'SELECT count(*) AS n FROM certificate_types WHERE is_active = 1 AND id <> ?',
			id
		);
		// The public form would offer nothing.
		if (!others?.n) return { ok: false, reason: 'last_active' };
	}

	const timestamp = nowIso();
	await db.batch([
		db.prepare(
			`UPDATE certificate_types SET title = ?, body_template = ?, is_active = ?, updated_at = ?
			  WHERE id = ?`,
			input.title,
			input.bodyTemplate,
			toDbBoolean(input.isActive),
			timestamp,
			id
		),
		db.prepare(
			`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
			 VALUES (?, ?, 'certificate_type.updated', 'certificate_types', ?, ?, ?)`,
			newId(),
			adminUserId,
			id,
			JSON.stringify({
				previous: {
					title: current.title,
					body_template: current.body_template,
					is_active: current.is_active
				}
			}),
			timestamp
		)
	]);
	return { ok: true };
}
