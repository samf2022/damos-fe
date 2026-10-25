import { error } from '@sveltejs/kit';

import type { AdminRole, CertificateStatus, CertificateTypeCode, Gender } from '#lib/types.ts';

export type { AdminRole, CertificateStatus, CertificateTypeCode, Gender };
/** SQLite stores booleans as 0/1. */
export type DbBoolean = 0 | 1;

export interface CouncilSettingsRow {
	id: string;
	name: string;
	tax_id: string | null;
	state: string;
	municipality: string;
	parish: string;
	sector_address: string;
	city: string;
	logo_r2_key: string | null;
	validity_months: number;
	validity_note: string | null;
	created_at: string;
	updated_at: string;
}

export interface SignerRow {
	id: string;
	full_name: string;
	short_name: string;
	national_id: string;
	role_title: string;
	phone: string | null;
	gender: Gender;
	is_active: DbBoolean;
	display_order: number;
	created_at: string;
	updated_at: string;
}

export interface CertificateTypeRow {
	id: string;
	code: CertificateTypeCode;
	title: string;
	body_template: string;
	is_active: DbBoolean;
	created_at: string;
	updated_at: string;
}

export interface CertificateTypeSignerRow {
	certificate_type_id: string;
	signer_id: string;
	display_order: number;
}

export interface ResidentRow {
	id: string;
	national_id: string;
	first_names: string;
	last_names: string;
	gender: Gender;
	marital_status: string | null;
	occupation: string | null;
	street_address: string;
	house_number: string | null;
	phone: string | null;
	created_at: string;
	updated_at: string;
}

export interface CertificateRow {
	id: string;
	resident_id: string;
	certificate_type_id: string;
	serial_number: string | null;
	status: CertificateStatus;
	rejection_reason: string | null;
	known_since_text: string | null;
	/** JSON-encoded copy of the resident at submission time. */
	resident_snapshot: string;
	rendered_body: string | null;
	pdf_r2_key: string | null;
	verification_code: string | null;
	submitted_at: string;
	reviewed_at: string | null;
	reviewed_by: string | null;
	issued_at: string | null;
	expires_at: string | null;
	whatsapp_sent_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface CertificateSignerRow {
	certificate_id: string;
	signer_id: string | null;
	full_name: string;
	short_name: string;
	role_title: string;
	phone: string | null;
	display_order: number;
}

export interface AdminUserRow {
	id: string;
	username: string;
	display_name: string;
	password_hash: string;
	password_salt: string;
	role: AdminRole;
	is_active: DbBoolean;
	created_at: string;
	updated_at: string;
}

export interface SessionRow {
	id: string;
	admin_user_id: string;
	expires_at: string;
	created_at: string;
}

export interface AuditLogRow {
	id: string;
	admin_user_id: string | null;
	action: string;
	entity: string;
	entity_id: string | null;
	/** JSON-encoded */
	metadata: string | null;
	created_at: string;
}

export type SqlValue = string | number | null;

/** Thin typed wrapper over a D1 database binding. */
export interface Db {
	/** First row or `null`. */
	first<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
	/** All rows. */
	all<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
	/** Executes a write statement and returns the number of changed rows. */
	run(sql: string, ...params: SqlValue[]): Promise<number>;
	/** Builds a prepared statement to be used with `batch`. */
	prepare(sql: string, ...params: SqlValue[]): D1PreparedStatement;
	/** Runs several statements atomically. */
	batch(statements: D1PreparedStatement[]): Promise<void>;
	raw: D1Database;
}

export function createDb(d1: D1Database): Db {
	const prepare = (sql: string, ...params: SqlValue[]) => d1.prepare(sql).bind(...params);

	return {
		raw: d1,
		prepare,
		first: <T>(sql: string, ...params: SqlValue[]) => prepare(sql, ...params).first<T>(),
		all: async <T>(sql: string, ...params: SqlValue[]) =>
			(await prepare(sql, ...params).all<T>()).results,
		run: async (sql: string, ...params: SqlValue[]) =>
			(await prepare(sql, ...params).run()).meta.changes,
		batch: async (statements) => {
			await d1.batch(statements);
		}
	};
}

/** Returns the database for the current request, or a 500 if the binding is missing. */
export function getDb(platform: App.Platform | undefined): Db {
	const d1 = platform?.env?.DB;
	if (!d1) error(500, 'D1 binding "DB" is not available');
	return createDb(d1);
}

export function newId(): string {
	return crypto.randomUUID();
}

export function nowIso(date: Date = new Date()): string {
	return date.toISOString();
}

export function fromDbBoolean(value: DbBoolean): boolean {
	return value === 1;
}

export function toDbBoolean(value: boolean): DbBoolean {
	return value ? 1 : 0;
}
