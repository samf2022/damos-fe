-- Initial schema for damos-fe.
-- Conventions: TEXT UUID ids, ISO-8601 dates stored as TEXT, booleans as INTEGER 0/1.

-- Single-row table with the communal council data.
CREATE TABLE council_settings (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	tax_id TEXT,
	state TEXT NOT NULL,
	municipality TEXT NOT NULL,
	parish TEXT NOT NULL,
	sector_address TEXT NOT NULL,
	city TEXT NOT NULL,
	logo_r2_key TEXT,
	validity_months INTEGER NOT NULL DEFAULT 6 CHECK (validity_months > 0),
	validity_note TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE signers (
	id TEXT PRIMARY KEY NOT NULL,
	full_name TEXT NOT NULL,
	short_name TEXT NOT NULL,
	national_id TEXT NOT NULL,
	role_title TEXT NOT NULL,
	phone TEXT,
	gender TEXT NOT NULL CHECK (gender IN ('F', 'M')),
	is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
	display_order INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_signers_national_id ON signers (national_id);

CREATE TABLE certificate_types (
	id TEXT PRIMARY KEY NOT NULL,
	code TEXT NOT NULL UNIQUE CHECK (code IN ('residence', 'residence_conduct', 'conduct')),
	title TEXT NOT NULL,
	body_template TEXT NOT NULL,
	is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Default signers for each certificate type.
CREATE TABLE certificate_type_signers (
	certificate_type_id TEXT NOT NULL REFERENCES certificate_types (id) ON DELETE CASCADE,
	signer_id TEXT NOT NULL REFERENCES signers (id) ON DELETE CASCADE,
	display_order INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (certificate_type_id, signer_id)
);

CREATE INDEX idx_certificate_type_signers_signer_id ON certificate_type_signers (signer_id);

CREATE TABLE residents (
	id TEXT PRIMARY KEY NOT NULL,
	national_id TEXT NOT NULL UNIQUE,
	first_names TEXT NOT NULL,
	last_names TEXT NOT NULL,
	gender TEXT NOT NULL CHECK (gender IN ('F', 'M')),
	marital_status TEXT,
	occupation TEXT,
	street_address TEXT NOT NULL,
	house_number TEXT,
	phone TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE admin_users (
	id TEXT PRIMARY KEY NOT NULL,
	username TEXT NOT NULL UNIQUE COLLATE NOCASE,
	display_name TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	password_salt TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'reviewer' CHECK (role IN ('admin', 'reviewer')),
	is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE certificates (
	id TEXT PRIMARY KEY NOT NULL,
	resident_id TEXT NOT NULL REFERENCES residents (id) ON DELETE RESTRICT,
	certificate_type_id TEXT NOT NULL REFERENCES certificate_types (id) ON DELETE RESTRICT,
	serial_number TEXT UNIQUE,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
	rejection_reason TEXT,
	known_since_text TEXT,
	resident_snapshot TEXT NOT NULL CHECK (json_valid(resident_snapshot)),
	rendered_body TEXT,
	pdf_r2_key TEXT,
	verification_code TEXT UNIQUE,
	submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	reviewed_at TEXT,
	reviewed_by TEXT REFERENCES admin_users (id) ON DELETE SET NULL,
	issued_at TEXT,
	expires_at TEXT,
	whatsapp_sent_at TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_certificates_resident_id ON certificates (resident_id);
CREATE INDEX idx_certificates_certificate_type_id ON certificates (certificate_type_id);
CREATE INDEX idx_certificates_reviewed_by ON certificates (reviewed_by);
CREATE INDEX idx_certificates_status ON certificates (status, submitted_at);
-- serial_number and verification_code are UNIQUE, which already creates an index.

-- Snapshot of the signers at issue time, so later edits to `signers` don't alter issued certificates.
CREATE TABLE certificate_signers (
	certificate_id TEXT NOT NULL REFERENCES certificates (id) ON DELETE CASCADE,
	signer_id TEXT REFERENCES signers (id) ON DELETE SET NULL,
	full_name TEXT NOT NULL,
	short_name TEXT NOT NULL,
	role_title TEXT NOT NULL,
	phone TEXT,
	display_order INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (certificate_id, display_order)
);

CREATE INDEX idx_certificate_signers_signer_id ON certificate_signers (signer_id);

-- `id` stores the SHA-256 hash of the session token, never the token itself.
CREATE TABLE sessions (
	id TEXT PRIMARY KEY NOT NULL,
	admin_user_id TEXT NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_sessions_admin_user_id ON sessions (admin_user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

CREATE TABLE audit_logs (
	id TEXT PRIMARY KEY NOT NULL,
	admin_user_id TEXT REFERENCES admin_users (id) ON DELETE SET NULL,
	action TEXT NOT NULL,
	entity TEXT NOT NULL,
	entity_id TEXT,
	metadata TEXT CHECK (metadata IS NULL OR json_valid(metadata)),
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_audit_logs_admin_user_id ON audit_logs (admin_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
