import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
	buildCertificateDocument,
	defaultValidityNote,
	PDF_FONTS,
	type CertificatePdfInput
} from './generateCertificatePdf';

// 1×1 PNG, enough to exercise the image path.
const PNG_DATA_URL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Fictitious data.
const input: CertificatePdfInput = {
	council: {
		name: 'Consejo Comunal “Los Pinos”',
		taxId: 'J-12345678-9',
		state: 'Sucre',
		municipality: 'Bermúdez',
		parish: 'Santa Catalina',
		logoDataUrl: PNG_DATA_URL
	},
	certificate: {
		title: 'Constancia de Residencia',
		serialNumber: '2026-0001',
		renderedBody: 'Nosotras, … a la ciudadana MARÍA PÉREZ, venezolana, … sector.',
		residentName: 'MARÍA PÉREZ',
		validityNote: defaultValidityNote(6)
	},
	signers: [
		{ shortName: 'Ana Gómez', roleTitle: 'Voc. Finanzas', phone: '0294-3318046' },
		{ shortName: 'Carmen Díaz', roleTitle: 'Voc. Contraloría Social', phone: null }
	]
};

describe('defaultValidityNote', () => {
	it('writes the months in words and digits', () => {
		expect(defaultValidityNote(6)).toBe(
			'La presente tendrá vigencia por seis (6) meses a partir de esta fecha.'
		);
		expect(defaultValidityNote(1)).toBe(
			'La presente tendrá vigencia por un (1) mes a partir de esta fecha.'
		);
	});
});

describe('buildCertificateDocument', () => {
	it('lays out header, upright resident name, signatures and note, without QR', () => {
		const doc = buildCertificateDocument(input);
		const json = JSON.stringify(doc.content);
		expect(doc.pageSize).toBe('A4');
		expect(json).toContain('Municipio Bermúdez – Parroquia Santa Catalina del Estado Sucre');
		expect(json).toContain('Consejo Comunal “Los Pinos”   RIF. J-12345678-9');
		expect(json).toContain('CONSTANCIA DE RESIDENCIA');
		expect(json).toContain('{"text":"MARÍA PÉREZ,","italics":false}');
		expect(json).toContain('Tlf: 0294 - 3318046');
		expect(json).not.toContain('"qr"');
		expect(json).toContain('Nota: La presente tendrá vigencia por seis (6) meses');
	});

	it('renders to a real PDF with the standard fonts', async () => {
		// The Node build of pdfmake (the browser build is used in the app).
		const pdfmake = createRequire(import.meta.url)('pdfmake');
		pdfmake.setFonts(PDF_FONTS);
		const buffer: Buffer = await pdfmake.createPdf(buildCertificateDocument(input)).getBuffer();
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
		expect(buffer.length).toBeGreaterThan(2000);
	});
});
