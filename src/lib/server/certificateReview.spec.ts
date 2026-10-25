import { beforeEach, describe, expect, it } from 'vitest';
import type { CertificateRequestInput } from '#lib/validation/certificateRequest.ts';
import { submitCertificateRequest } from './certificateRequests';
import {
	addMonths,
	approveCertificate,
	generateVerificationCode,
	getReviewData,
	rejectCertificate
} from './certificateReview';
import { createDb, type CertificateRow, type Db, type ResidentRow } from './db';
import { createMemoryD1 } from './testing/memoryD1';

const RESIDENCE = '00000000-0000-4000-8000-000000000101';
const SIGNERS = [
	'00000000-0000-4000-8000-000000000201', // F
	'00000000-0000-4000-8000-000000000202', // M
	'00000000-0000-4000-8000-000000000203' // F
];
const NOW = new Date('2026-07-13T15:00:00.000Z');

const request: CertificateRequestInput = {
	certificateTypeId: RESIDENCE,
	nationalId: 'V-12345678',
	firstNames: 'María José',
	lastNames: 'Pérez',
	gender: 'F',
	maritalStatus: 'single',
	occupation: null,
	streetAddress: 'Calle 5',
	houseNumber: null,
	phone: '0412-1234567',
	knownSinceText: 'más de 20 años'
};

async function submit(db: Db, overrides: Partial<CertificateRequestInput> = {}) {
	const result = await submitCertificateRequest(db, { ...request, ...overrides });
	if (!result.ok) throw new Error(result.reason);
	return result.certificateId;
}

describe('helpers', () => {
	it('generates unambiguous 10-character codes', () => {
		const code = generateVerificationCode();
		expect(code).toMatch(/^[2-9A-HJ-NP-Z]{10}$/);
		expect(generateVerificationCode()).not.toBe(code);
	});

	it('adds months clamping to the end of the month', () => {
		expect(addMonths(new Date('2026-07-13T15:00:00Z'), 6).toISOString()).toBe(
			'2027-01-13T15:00:00.000Z'
		);
		expect(addMonths(new Date('2026-08-31T12:00:00Z'), 6).toISOString()).toBe(
			'2027-02-28T12:00:00.000Z'
		);
	});
});

describe('certificate review', () => {
	let db: Db;
	const reviewerId = 'admin-1';

	beforeEach(async () => {
		db = createDb(createMemoryD1({ seed: true }));
		await db.run(
			`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role)
			 VALUES (?, 'admin', 'Admin', 'x', 'y', 'admin')`,
			reviewerId
		);
	});

	it('loads review data with default signers first', async () => {
		const id = await submit(db);
		const data = await getReviewData(db, id);
		expect(data?.certificate.type_title).toBe('Constancia de Residencia');
		expect(data?.signers.map((s) => s.id)).toEqual(SIGNERS);
		expect(data?.signers.every((s) => s.is_default === 1)).toBe(true);
	});

	it('approves: serial, code, frozen body, signer snapshot and expiry', async () => {
		const id = await submit(db);
		const result = await approveCertificate(db, {
			certificateId: id,
			reviewerId,
			signerIds: [SIGNERS[0], SIGNERS[2]],
			knownSinceText: 'más de veinte (20) años',
			updateResident: false,
			now: NOW
		});
		expect(result).toMatchObject({ ok: true, serialNumber: '2026-0001' });

		const certificate = await db.first<CertificateRow>(
			'SELECT * FROM certificates WHERE id = ?',
			id
		);
		expect(certificate).toMatchObject({
			status: 'approved',
			serial_number: '2026-0001',
			known_since_text: 'más de veinte (20) años',
			issued_at: '2026-07-13T15:00:00.000Z',
			expires_at: '2027-01-13T15:00:00.000Z',
			reviewed_by: reviewerId
		});
		expect(certificate?.verification_code).toMatch(/^[2-9A-HJ-NP-Z]{10}$/);
		expect(certificate?.rendered_body).toMatch(
			/^Nosotras, integrantes del Consejo Comunal Ejemplo/
		);
		expect(certificate?.rendered_body).toContain('desde hace más de veinte (20) años');
		expect(certificate?.rendered_body).toContain('a los trece días del mes de julio');
		expect(certificate?.rendered_body).not.toContain('{{');

		const signers = await db.all<{ full_name: string; display_order: number }>(
			'SELECT full_name, display_order FROM certificate_signers WHERE certificate_id = ? ORDER BY display_order',
			id
		);
		expect(signers.map((s) => s.display_order)).toEqual([1, 2]);
		expect(signers[0].full_name).toBe('María Fernanda Ejemplo Prueba');

		const log = await db.first<{ action: string }>(
			"SELECT action FROM audit_logs WHERE action = 'certificate.approved'"
		);
		expect(log).not.toBeNull();
	});

	it('numbers serials per year', async () => {
		const first = await submit(db);
		const second = await submit(db, { nationalId: 'V-7654321' });
		const third = await submit(db, { nationalId: 'V-1111111' });
		const approve = (certificateId: string, now: Date) =>
			approveCertificate(db, {
				certificateId,
				reviewerId,
				signerIds: SIGNERS,
				knownSinceText: '10 años',
				updateResident: false,
				now
			});

		expect(await approve(first, NOW)).toMatchObject({ serialNumber: '2026-0001' });
		expect(await approve(second, NOW)).toMatchObject({ serialNumber: '2026-0002' });
		// 2027-01-01 02:00 UTC is still Dec 31 in Caracas.
		expect(await approve(third, new Date('2027-01-01T02:00:00Z'))).toMatchObject({
			serialNumber: '2026-0003'
		});
	});

	it('uses "Nosotros" when a male signer is selected', async () => {
		const id = await submit(db);
		await approveCertificate(db, {
			certificateId: id,
			reviewerId,
			signerIds: SIGNERS,
			knownSinceText: '10 años',
			updateResident: false,
			now: NOW
		});
		const { rendered_body } = (await db.first<CertificateRow>('SELECT * FROM certificates'))!;
		expect(rendered_body).toMatch(/^Nosotros,/);
	});

	it('updates the resident record from the snapshot only when asked', async () => {
		await submit(db);
		const second = await submit(db, {
			certificateTypeId: '00000000-0000-4000-8000-000000000103',
			streetAddress: 'Avenida Nueva'
		});
		await approveCertificate(db, {
			certificateId: second,
			reviewerId,
			signerIds: SIGNERS,
			knownSinceText: '10 años',
			updateResident: true,
			now: NOW
		});
		const resident = await db.first<ResidentRow>('SELECT * FROM residents');
		expect(resident?.street_address).toBe('Avenida Nueva');
	});

	it('refuses to approve twice, without signers or with blank template values', async () => {
		const id = await submit(db);
		const base = {
			certificateId: id,
			reviewerId,
			signerIds: SIGNERS,
			knownSinceText: '10 años',
			updateResident: false,
			now: NOW
		};

		expect(await approveCertificate(db, { ...base, signerIds: [] })).toEqual({
			ok: false,
			reason: 'no_signers'
		});
		expect(await approveCertificate(db, { ...base, knownSinceText: '' })).toEqual({
			ok: false,
			reason: 'template_incomplete',
			missing: ['certificate.knownSince']
		});
		expect((await approveCertificate(db, base)).ok).toBe(true);
		expect(await approveCertificate(db, base)).toEqual({ ok: false, reason: 'already_reviewed' });
		expect(await approveCertificate(db, { ...base, certificateId: 'nope' })).toEqual({
			ok: false,
			reason: 'not_found'
		});

		const signers = await db.first<{ n: number }>('SELECT count(*) AS n FROM certificate_signers');
		expect(signers?.n).toBe(3);
	});

	it('rejects with a reason, once', async () => {
		const id = await submit(db);
		expect(
			await rejectCertificate(db, {
				certificateId: id,
				reviewerId,
				reason: 'Dirección fuera del sector'
			})
		).toEqual({ ok: true });

		const certificate = await db.first<CertificateRow>('SELECT * FROM certificates');
		expect(certificate).toMatchObject({
			status: 'rejected',
			rejection_reason: 'Dirección fuera del sector',
			serial_number: null,
			verification_code: null
		});

		expect(await rejectCertificate(db, { certificateId: id, reviewerId, reason: 'x' })).toEqual({
			ok: false,
			reason: 'already_reviewed'
		});
		expect(
			await approveCertificate(db, {
				certificateId: id,
				reviewerId,
				signerIds: SIGNERS,
				knownSinceText: '10 años',
				updateResident: false
			})
		).toEqual({ ok: false, reason: 'already_reviewed' });
	});
});
