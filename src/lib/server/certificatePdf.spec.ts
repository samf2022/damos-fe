import { beforeEach, describe, expect, it } from 'vitest';
import { markWhatsAppSent, MAX_PDF_BYTES, storeCertificatePdf } from './certificatePdf';
import { createDb, type CertificateRow, type Db } from './db';
import { createMemoryD1 } from './testing/memoryD1';

const ADMIN = 'admin-1';
const PDF = new TextEncoder().encode('%PDF-1.3\n…');

function fakeBucket() {
	const objects = new Map<string, R2HTTPMetadata | undefined>();
	return {
		objects,
		put: async (key: string, _value: unknown, options?: R2PutOptions) => {
			objects.set(key, options?.httpMetadata as R2HTTPMetadata | undefined);
			return null as unknown as R2Object;
		}
	};
}

let db: Db;
beforeEach(async () => {
	db = createDb(createMemoryD1({ seed: true }));
	await db.run(
		`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role)
		 VALUES (?, 'admin', 'Admin', 'x', 'y', 'admin')`,
		ADMIN
	);
	await db.run(
		`INSERT INTO residents (id, national_id, first_names, last_names, gender, street_address)
		 VALUES ('r1', 'V-1', 'A', 'B', 'F', 'Calle')`
	);
	await db.run(
		`INSERT INTO certificates (id, resident_id, certificate_type_id, status, resident_snapshot, serial_number)
		 VALUES ('approved', 'r1', '00000000-0000-4000-8000-000000000101', 'approved', '{}', '2026-0007'),
		        ('pending', 'r1', '00000000-0000-4000-8000-000000000103', 'pending', '{}', NULL)`
	);
});

describe('storeCertificatePdf', () => {
	it('stores the PDF privately with a friendly file name', async () => {
		const bucket = fakeBucket();
		const result = await storeCertificatePdf(
			db,
			bucket,
			'approved',
			new File([PDF], 'x.pdf'),
			ADMIN
		);
		expect(result).toEqual({ ok: true, key: 'certificates/approved.pdf' });
		expect(bucket.objects.get('certificates/approved.pdf')).toEqual({
			contentType: 'application/pdf',
			contentDisposition: 'inline; filename="Constancia-2026-0007.pdf"'
		});
		const row = await db.first<CertificateRow>("SELECT * FROM certificates WHERE id = 'approved'");
		expect(row?.pdf_r2_key).toBe('certificates/approved.pdf');
	});

	it('rejects non-approved certificates and invalid files', async () => {
		const bucket = fakeBucket();
		const pdf = new File([PDF], 'x.pdf');
		expect(await storeCertificatePdf(db, bucket, 'pending', pdf, ADMIN)).toEqual({
			ok: false,
			reason: 'not_approved'
		});
		expect(await storeCertificatePdf(db, bucket, 'nope', pdf, ADMIN)).toEqual({
			ok: false,
			reason: 'not_found'
		});
		expect(await storeCertificatePdf(db, bucket, 'approved', null, ADMIN)).toEqual({
			ok: false,
			reason: 'pdf_missing'
		});
		expect(
			await storeCertificatePdf(db, bucket, 'approved', new File(['<html>'], 'x.pdf'), ADMIN)
		).toEqual({ ok: false, reason: 'pdf_invalid' });
		const big = new File([PDF, new Uint8Array(MAX_PDF_BYTES)], 'x.pdf');
		expect(await storeCertificatePdf(db, bucket, 'approved', big, ADMIN)).toEqual({
			ok: false,
			reason: 'pdf_too_large'
		});
		expect(bucket.objects.size).toBe(0);
	});
});

describe('markWhatsAppSent', () => {
	it('records the send only for approved certificates', async () => {
		expect(await markWhatsAppSent(db, 'approved', ADMIN)).toBe(true);
		expect(await markWhatsAppSent(db, 'pending', ADMIN)).toBe(false);
		const row = await db.first<CertificateRow>("SELECT * FROM certificates WHERE id = 'approved'");
		expect(row?.whatsapp_sent_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		const log = await db.first<{ n: number }>(
			"SELECT count(*) AS n FROM audit_logs WHERE action = 'certificate.whatsapp_sent'"
		);
		expect(log?.n).toBe(1);
	});
});
