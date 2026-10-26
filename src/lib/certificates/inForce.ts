import type { CertificateStatus } from '#lib/types.ts';

/** Approved and not yet expired. */
export const isInForce = (
	certificate: { status: CertificateStatus; expires_at: string | null },
	now: Date = new Date()
) =>
	certificate.status === 'approved' &&
	certificate.expires_at !== null &&
	new Date(certificate.expires_at) > now;
