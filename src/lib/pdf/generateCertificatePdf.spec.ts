import { describe, expect, it } from 'vitest';
import {
	buildCertificateDocument,
	generateCertificatePdf,
	type CertificatePdfInput
} from './generateCertificatePdf';

const input: CertificatePdfInput = {
	council: {
		name: 'Consejo Comunal Ejemplo',
		taxId: null,
		state: 'Estado Ejemplo',
		municipality: 'Municipio Ejemplo',
		parish: 'Parroquia Ejemplo',
		logoDataUrl: null
	},
	certificate: {
		title: 'Constancia de Residencia',
		serialNumber: '2026-0001',
		renderedBody: 'Texto de prueba',
		issuedAt: '2026-07-13T12:00:00.000Z',
		expiresAt: '2027-01-13T12:00:00.000Z',
		validityNote: null,
		verificationUrl: 'https://example.com/verify/ABC123'
	},
	signers: []
};

describe('generateCertificatePdf (stub)', () => {
	it('builds a document definition with the verification QR', () => {
		const doc = buildCertificateDocument(input);
		expect(doc.info?.title).toBe('Constancia de Residencia 2026-0001');
		expect(JSON.stringify(doc.content)).toContain('https://example.com/verify/ABC123');
	});

	it('is not implemented yet', async () => {
		await expect(generateCertificatePdf(input)).rejects.toThrow('not implemented');
	});
});
