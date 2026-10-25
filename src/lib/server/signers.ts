import type { SignerInput } from '#lib/validation/signer.ts';
import {
	newId,
	nowIso,
	toDbBoolean,
	type CertificateTypeRow,
	type Db,
	type SignerRow
} from './db.ts';

export type SignerWithTypes = SignerRow & { certificate_type_ids: string[] };

export async function listSigners(db: Db): Promise<SignerWithTypes[]> {
	const [signers, links] = await Promise.all([
		db.all<SignerRow>('SELECT * FROM signers ORDER BY is_active DESC, display_order, full_name'),
		db.all<{ signer_id: string; certificate_type_id: string }>(
			'SELECT signer_id, certificate_type_id FROM certificate_type_signers'
		)
	]);
	return signers.map((signer) => ({
		...signer,
		certificate_type_ids: links
			.filter((link) => link.signer_id === signer.id)
			.map((link) => link.certificate_type_id)
	}));
}

export async function getSigner(db: Db, id: string): Promise<SignerWithTypes | null> {
	const signer = await db.first<SignerRow>('SELECT * FROM signers WHERE id = ?', id);
	if (!signer) return null;
	const links = await db.all<{ certificate_type_id: string }>(
		'SELECT certificate_type_id FROM certificate_type_signers WHERE signer_id = ?',
		id
	);
	return { ...signer, certificate_type_ids: links.map((link) => link.certificate_type_id) };
}

export async function listCertificateTypes(db: Db) {
	return db.all<Pick<CertificateTypeRow, 'id' | 'code' | 'title' | 'is_active'>>(
		'SELECT id, code, title, is_active FROM certificate_types ORDER BY title'
	);
}

/** Creates (no `id`) or updates a signer and replaces its default certificate types. */
export async function saveSigner(
	db: Db,
	input: SignerInput,
	adminUserId: string,
	id?: string
): Promise<{ ok: true; id: string } | { ok: false; reason: 'not_found' }> {
	if (id && !(await db.first('SELECT 1 FROM signers WHERE id = ?', id))) {
		return { ok: false, reason: 'not_found' };
	}
	const signerId = id ?? newId();
	const timestamp = nowIso();
	const fields = [
		input.fullName,
		input.shortName,
		input.nationalId,
		input.roleTitle,
		input.phone,
		input.gender,
		input.displayOrder,
		timestamp
	];

	// Only link types that exist; ignore anything else a crafted request might send.
	const validTypeIds = new Set((await listCertificateTypes(db)).map((type) => type.id));
	const typeIds = input.certificateTypeIds.filter((typeId) => validTypeIds.has(typeId));

	await db.batch([
		id
			? db.prepare(
					`UPDATE signers SET full_name = ?, short_name = ?, national_id = ?, role_title = ?,
					        phone = ?, gender = ?, display_order = ?, updated_at = ?
					  WHERE id = ?`,
					...fields,
					signerId
				)
			: db.prepare(
					`INSERT INTO signers (full_name, short_name, national_id, role_title, phone, gender,
					                      display_order, updated_at, id)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					...fields,
					signerId
				),
		db.prepare('DELETE FROM certificate_type_signers WHERE signer_id = ?', signerId),
		...typeIds.map((typeId) =>
			db.prepare(
				`INSERT INTO certificate_type_signers (certificate_type_id, signer_id, display_order)
				 VALUES (?, ?, ?)`,
				typeId,
				signerId,
				input.displayOrder
			)
		),
		audit(db, adminUserId, id ? 'signer.updated' : 'signer.created', signerId)
	]);
	return { ok: true, id: signerId };
}

/**
 * Signers are deactivated rather than deleted: issued certificates keep their own copy in
 * certificate_signers, and a deactivated signer can be restored.
 */
export async function setSignerActive(
	db: Db,
	id: string,
	active: boolean,
	adminUserId: string
): Promise<boolean> {
	const changes = await db.run(
		'UPDATE signers SET is_active = ?, updated_at = ? WHERE id = ?',
		toDbBoolean(active),
		nowIso(),
		id
	);
	if (changes === 0) return false;
	await db.batch([audit(db, adminUserId, active ? 'signer.activated' : 'signer.deactivated', id)]);
	return true;
}

function audit(db: Db, adminUserId: string, action: string, signerId: string) {
	return db.prepare(
		`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, created_at)
		 VALUES (?, ?, ?, 'signers', ?, ?)`,
		newId(),
		adminUserId,
		action,
		signerId,
		nowIso()
	);
}
