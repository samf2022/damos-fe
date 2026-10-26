// Residents admin: search, profile with certificate history, and corrections.
import type { ResidentSnapshot } from '#lib/types.ts';
import { normalizeNationalId, type ResidentInput } from '#lib/validation/resident.ts';
import {
	newId,
	nowIso,
	type CertificateRow,
	type Db,
	type ResidentRow,
	type SqlValue
} from './db.ts';

export const RESIDENTS_PAGE_SIZE = 25;

export function residentRowToSnapshot(row: ResidentRow): ResidentSnapshot {
	return {
		nationalId: row.national_id,
		firstNames: row.first_names,
		lastNames: row.last_names,
		gender: row.gender,
		maritalStatus: row.marital_status,
		occupation: row.occupation,
		streetAddress: row.street_address,
		houseNumber: row.house_number,
		phone: row.phone
	};
}

export type ResidentSummary = Pick<
	ResidentRow,
	'id' | 'national_id' | 'first_names' | 'last_names' | 'phone'
> & { certificate_count: number; last_submitted_at: string | null };

/** `q` is a cédula (exact, any format) or part of the name. */
export async function listResidents(
	db: Db,
	filters: { q: string; page: number }
): Promise<{ residents: ResidentSummary[]; total: number }> {
	const where: string[] = [];
	const params: SqlValue[] = [];
	const q = filters.q.trim();
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
	const [residents, total] = await Promise.all([
		db.all<ResidentSummary>(
			`SELECT r.id, r.national_id, r.first_names, r.last_names, r.phone,
			        count(c.id) AS certificate_count, max(c.submitted_at) AS last_submitted_at
			   FROM residents r
			   LEFT JOIN certificates c ON c.resident_id = r.id
			   ${whereSql}
			  GROUP BY r.id
			  ORDER BY r.last_names, r.first_names
			  LIMIT ? OFFSET ?`,
			...params,
			RESIDENTS_PAGE_SIZE,
			(filters.page - 1) * RESIDENTS_PAGE_SIZE
		),
		db.first<{ n: number }>(`SELECT count(*) AS n FROM residents r ${whereSql}`, ...params)
	]);
	return { residents, total: total?.n ?? 0 };
}

export type ResidentCertificate = Pick<
	CertificateRow,
	'id' | 'status' | 'serial_number' | 'submitted_at' | 'issued_at' | 'expires_at'
> & { type_title: string; certificate_type_id: string };

export interface ResidentDetail {
	resident: ResidentRow;
	/** Newest first. */
	certificates: ResidentCertificate[];
}

export async function getResidentDetail(db: Db, id: string): Promise<ResidentDetail | null> {
	const resident = await db.first<ResidentRow>('SELECT * FROM residents WHERE id = ?', id);
	if (!resident) return null;
	const certificates = await db.all<ResidentCertificate>(
		`SELECT c.id, c.status, c.serial_number, c.submitted_at, c.issued_at, c.expires_at,
		        c.certificate_type_id, t.title AS type_title
		   FROM certificates c
		   JOIN certificate_types t ON t.id = c.certificate_type_id
		  WHERE c.resident_id = ?
		  ORDER BY c.submitted_at DESC`,
		id
	);
	return { resident, certificates };
}

export type SaveResidentResult =
	| { ok: true; updatedPending: number }
	| { ok: false; reason: 'not_found' | 'duplicate_national_id' };

/**
 * Corrects a resident's record. With `applyToPending`, the data submitted with their pending
 * requests is replaced too, since certificates are issued from that copy. Issued certificates
 * never change.
 */
export async function saveResident(
	db: Db,
	id: string,
	input: ResidentInput,
	adminUserId: string,
	options: { applyToPending: boolean }
): Promise<SaveResidentResult> {
	const current = await db.first<ResidentRow>('SELECT * FROM residents WHERE id = ?', id);
	if (!current) return { ok: false, reason: 'not_found' };
	const clash = await db.first(
		'SELECT 1 FROM residents WHERE national_id = ? AND id <> ?',
		input.nationalId,
		id
	);
	if (clash) return { ok: false, reason: 'duplicate_national_id' };

	const pending = options.applyToPending
		? await db.all<{ id: string }>(
				"SELECT id FROM certificates WHERE resident_id = ? AND status = 'pending'",
				id
			)
		: [];
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
	const timestamp = nowIso();

	await db.batch([
		db.prepare(
			`UPDATE residents SET national_id = ?, first_names = ?, last_names = ?, gender = ?,
			        marital_status = ?, occupation = ?, street_address = ?, house_number = ?, phone = ?,
			        updated_at = ?
			  WHERE id = ?`,
			snapshot.nationalId,
			snapshot.firstNames,
			snapshot.lastNames,
			snapshot.gender,
			snapshot.maritalStatus,
			snapshot.occupation,
			snapshot.streetAddress,
			snapshot.houseNumber,
			snapshot.phone,
			timestamp,
			id
		),
		...pending.map((certificate) =>
			db.prepare(
				`UPDATE certificates SET resident_snapshot = ?, updated_at = ?
				  WHERE id = ? AND status = 'pending'`,
				JSON.stringify(snapshot),
				timestamp,
				certificate.id
			)
		),
		db.prepare(
			`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
			 VALUES (?, ?, 'resident.updated', 'residents', ?, ?, ?)`,
			newId(),
			adminUserId,
			id,
			JSON.stringify({
				previous: residentRowToSnapshot(current),
				updatedPending: pending.map((certificate) => certificate.id)
			}),
			timestamp
		)
	]);
	return { ok: true, updatedPending: pending.length };
}
