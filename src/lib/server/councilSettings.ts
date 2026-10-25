import type { CouncilSettingsInput } from '#lib/validation/councilSettings.ts';
import { newId, nowIso, type CouncilSettingsRow, type Db } from './db.ts';

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** pdfmake only embeds JPEG and PNG, so those are the only formats accepted. */
export function detectImageType(bytes: Uint8Array): 'jpeg' | 'png' | null {
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
	const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (png.every((byte, i) => bytes[i] === byte)) return 'png';
	return null;
}

export async function getCouncilSettings(db: Db): Promise<CouncilSettingsRow | null> {
	return db.first<CouncilSettingsRow>('SELECT * FROM council_settings LIMIT 1');
}

/** Updates the single settings row, creating it if the table is empty. */
export async function saveCouncilSettings(
	db: Db,
	input: CouncilSettingsInput,
	adminUserId: string
): Promise<void> {
	const timestamp = nowIso();
	const existing = await getCouncilSettings(db);
	const id = existing?.id ?? newId();
	const values = [
		input.name,
		input.taxId,
		input.state,
		input.municipality,
		input.parish,
		input.sectorAddress,
		input.city,
		input.validityMonths,
		input.validityNote,
		timestamp
	];

	await db.batch([
		existing
			? db.prepare(
					`UPDATE council_settings SET name = ?, tax_id = ?, state = ?, municipality = ?, parish = ?,
					        sector_address = ?, city = ?, validity_months = ?, validity_note = ?, updated_at = ?
					  WHERE id = ?`,
					...values,
					id
				)
			: db.prepare(
					`INSERT INTO council_settings (name, tax_id, state, municipality, parish, sector_address,
					                               city, validity_months, validity_note, updated_at, id)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					...values,
					id
				),
		auditStatement(db, adminUserId, 'council_settings.updated', id, null)
	]);
}

type LogoBucket = Pick<R2Bucket, 'put' | 'delete'>;

export type LogoResult = { ok: true; key: string } | { ok: false; reason: LogoFailure };
export type LogoFailure = 'logo_missing' | 'logo_too_large' | 'logo_invalid_type' | 'no_council';

/**
 * Stores a new logo under `public/` (served without auth by /api/files) and points the
 * settings at it. Each upload gets a new key so caches never serve a stale logo.
 */
export async function replaceLogo(
	db: Db,
	bucket: LogoBucket,
	file: File | null,
	adminUserId: string
): Promise<LogoResult> {
	if (!file || file.size === 0) return { ok: false, reason: 'logo_missing' };
	if (file.size > MAX_LOGO_BYTES) return { ok: false, reason: 'logo_too_large' };

	const bytes = new Uint8Array(await file.arrayBuffer());
	const type = detectImageType(bytes);
	if (!type) return { ok: false, reason: 'logo_invalid_type' };

	const settings = await getCouncilSettings(db);
	if (!settings) return { ok: false, reason: 'no_council' };

	const key = `public/council-logo-${newId().slice(0, 8)}.${type === 'jpeg' ? 'jpg' : 'png'}`;
	await bucket.put(key, bytes, {
		httpMetadata: { contentType: `image/${type}`, contentDisposition: 'inline' }
	});
	await db.batch([
		db.prepare(
			'UPDATE council_settings SET logo_r2_key = ?, updated_at = ? WHERE id = ?',
			key,
			nowIso(),
			settings.id
		),
		auditStatement(db, adminUserId, 'council_settings.logo_updated', settings.id, { key })
	]);
	// Only remove the old object once the settings no longer reference it.
	if (settings.logo_r2_key) await bucket.delete(settings.logo_r2_key);
	return { ok: true, key };
}

export async function removeLogo(db: Db, bucket: LogoBucket, adminUserId: string): Promise<void> {
	const settings = await getCouncilSettings(db);
	if (!settings?.logo_r2_key) return;
	await db.batch([
		db.prepare(
			'UPDATE council_settings SET logo_r2_key = NULL, updated_at = ? WHERE id = ?',
			nowIso(),
			settings.id
		),
		auditStatement(db, adminUserId, 'council_settings.logo_removed', settings.id, null)
	]);
	await bucket.delete(settings.logo_r2_key);
}

function auditStatement(
	db: Db,
	adminUserId: string,
	action: string,
	entityId: string,
	metadata: Record<string, unknown> | null
) {
	return db.prepare(
		`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
		 VALUES (?, ?, ?, 'council_settings', ?, ?, ?)`,
		newId(),
		adminUserId,
		action,
		entityId,
		metadata ? JSON.stringify(metadata) : null,
		nowIso()
	);
}

/** True while the fictitious data from migrations/0002_seed.sql is still in use. */
export async function usesSampleData(db: Db): Promise<{ council: boolean; signers: boolean }> {
	const row = await db.first<{ council: number; signers: number }>(
		`SELECT
		   (SELECT count(*) FROM council_settings WHERE name = 'Consejo Comunal Ejemplo') AS council,
		   (SELECT count(*) FROM signers
		     WHERE is_active = 1 AND id LIKE '00000000-0000-4000-8000-0000000002%') AS signers`
	);
	return { council: (row?.council ?? 0) > 0, signers: (row?.signers ?? 0) > 0 };
}
