import { newId, nowIso, type Db } from './db.ts';

export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export const certificatePdfKey = (certificateId: string) => `certificates/${certificateId}.pdf`;

/** File name shown when the PDF is downloaded or shared: `Constancia-2026-0001.pdf`. */
export const certificatePdfFileName = (serialNumber: string) => `Constancia-${serialNumber}.pdf`;

type PdfFailure = 'not_found' | 'not_approved' | 'pdf_missing' | 'pdf_too_large' | 'pdf_invalid';

/**
 * Stores the PDF generated in the browser for an approved certificate. The key is fixed per
 * certificate, so regenerating overwrites it. Private: /api/files requires a session for it.
 */
export async function storeCertificatePdf(
	db: Db,
	bucket: Pick<R2Bucket, 'put'>,
	certificateId: string,
	file: File | null,
	adminUserId: string
): Promise<{ ok: true; key: string } | { ok: false; reason: PdfFailure }> {
	const certificate = await db.first<{ status: string; serial_number: string | null }>(
		'SELECT status, serial_number FROM certificates WHERE id = ?',
		certificateId
	);
	if (!certificate) return { ok: false, reason: 'not_found' };
	if (certificate.status !== 'approved' || !certificate.serial_number) {
		return { ok: false, reason: 'not_approved' };
	}
	if (!file || file.size === 0) return { ok: false, reason: 'pdf_missing' };
	if (file.size > MAX_PDF_BYTES) return { ok: false, reason: 'pdf_too_large' };

	const bytes = new Uint8Array(await file.arrayBuffer());
	if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
		return { ok: false, reason: 'pdf_invalid' };
	}

	const key = certificatePdfKey(certificateId);
	await bucket.put(key, bytes, {
		httpMetadata: {
			contentType: 'application/pdf',
			contentDisposition: `inline; filename="${certificatePdfFileName(certificate.serial_number)}"`
		}
	});
	const timestamp = nowIso();
	await db.batch([
		db.prepare(
			'UPDATE certificates SET pdf_r2_key = ?, updated_at = ? WHERE id = ?',
			key,
			timestamp,
			certificateId
		),
		audit(db, adminUserId, 'certificate.pdf_generated', certificateId, timestamp)
	]);
	return { ok: true, key };
}

/** Records that the certificate was sent by WhatsApp (keeps the latest send). */
export async function markWhatsAppSent(
	db: Db,
	certificateId: string,
	adminUserId: string
): Promise<boolean> {
	const timestamp = nowIso();
	const changes = await db.run(
		`UPDATE certificates SET whatsapp_sent_at = ?, updated_at = ?
		  WHERE id = ? AND status = 'approved'`,
		timestamp,
		timestamp,
		certificateId
	);
	if (changes === 0) return false;
	await db.batch([audit(db, adminUserId, 'certificate.whatsapp_sent', certificateId, timestamp)]);
	return true;
}

function audit(db: Db, adminUserId: string, action: string, certificateId: string, at: string) {
	return db.prepare(
		`INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, created_at)
		 VALUES (?, ?, ?, 'certificates', ?, ?)`,
		newId(),
		adminUserId,
		action,
		certificateId,
		at
	);
}
