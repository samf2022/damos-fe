import { beforeEach, describe, expect, it } from 'vitest';
import type { CertificateRequestInput } from '#lib/validation/certificateRequest.ts';
import { submitCertificateRequest } from './certificateRequests';
import { createDb, type CertificateRow, type Db, type ResidentRow } from './db';
import { createMemoryD1 } from './testing/memoryD1';

const RESIDENCE = '00000000-0000-4000-8000-000000000101';
const CONDUCT = '00000000-0000-4000-8000-000000000103';

const input: CertificateRequestInput = {
	certificateTypeId: RESIDENCE,
	nationalId: 'V-12345678',
	firstNames: 'María José',
	lastNames: 'Pérez',
	gender: 'F',
	maritalStatus: 'single',
	occupation: null,
	streetAddress: 'Calle 5',
	houseNumber: '12',
	phone: '0412-1234567',
	knownSinceText: 'más de 20 años'
};

describe('submitCertificateRequest', () => {
	let db: Db;

	beforeEach(() => {
		db = createDb(createMemoryD1({ seed: true }));
	});

	it('creates the resident and a pending certificate with a snapshot', async () => {
		const result = await submitCertificateRequest(db, input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const resident = await db.first<ResidentRow>('SELECT * FROM residents');
		expect(resident).toMatchObject({ national_id: 'V-12345678', first_names: 'María José' });

		const certificate = await db.first<CertificateRow>(
			'SELECT * FROM certificates WHERE id = ?',
			result.certificateId
		);
		expect(certificate).toMatchObject({
			resident_id: resident!.id,
			certificate_type_id: RESIDENCE,
			status: 'pending',
			known_since_text: 'más de 20 años',
			serial_number: null,
			verification_code: null
		});
		expect(JSON.parse(certificate!.resident_snapshot)).toMatchObject({
			nationalId: 'V-12345678',
			phone: '0412-1234567'
		});

		const log = await db.first<{ action: string }>('SELECT action FROM audit_logs');
		expect(log?.action).toBe('certificate.submitted');
	});

	it('reuses an existing resident without overwriting it', async () => {
		await submitCertificateRequest(db, input);
		const result = await submitCertificateRequest(db, {
			...input,
			certificateTypeId: CONDUCT,
			firstNames: 'Otro Nombre'
		});
		expect(result.ok).toBe(true);

		const residents = await db.all<ResidentRow>('SELECT * FROM residents');
		expect(residents).toHaveLength(1);
		expect(residents[0].first_names).toBe('María José');

		const snapshots = await db.all<{ resident_snapshot: string }>(
			'SELECT resident_snapshot FROM certificates ORDER BY certificate_type_id'
		);
		expect(JSON.parse(snapshots[1].resident_snapshot).firstNames).toBe('Otro Nombre');
	});

	it('rejects a duplicate pending request of the same type', async () => {
		await submitCertificateRequest(db, input);
		expect(await submitCertificateRequest(db, input)).toEqual({
			ok: false,
			reason: 'duplicate_pending'
		});
	});

	it('allows a new request once the previous one was reviewed', async () => {
		await submitCertificateRequest(db, input);
		await db.run("UPDATE certificates SET status = 'rejected'");
		expect((await submitCertificateRequest(db, input)).ok).toBe(true);
	});

	it('rejects unknown or inactive certificate types', async () => {
		expect(await submitCertificateRequest(db, { ...input, certificateTypeId: 'nope' })).toEqual({
			ok: false,
			reason: 'type_unavailable'
		});

		await db.run('UPDATE certificate_types SET is_active = 0 WHERE id = ?', RESIDENCE);
		expect((await submitCertificateRequest(db, input)).ok).toBe(false);
		expect(await db.first('SELECT * FROM residents')).toBeNull();
	});
});
