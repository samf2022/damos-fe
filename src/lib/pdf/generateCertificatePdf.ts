// Certificate PDF, modeled on the council's paper certificates: A4, centered Times header,
// logo, italic title and justified italic body (resident name upright), signature columns
// and the validity note.
//
// `buildCertificateDocument` is pure (also used by tests in Node). `generateCertificatePdf`
// runs in the browser only: import it from event handlers, never from server code.
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { numberToSpanishWords } from '#lib/text/numberToSpanishWords.ts';

export interface CertificatePdfSigner {
	shortName: string;
	roleTitle: string;
	phone: string | null;
}

export interface CertificatePdfInput {
	council: {
		name: string;
		taxId: string | null;
		state: string;
		municipality: string;
		parish: string;
		/** Data URL (JPEG/PNG) of the logo, if any. */
		logoDataUrl: string | null;
	};
	certificate: {
		title: string;
		serialNumber: string;
		/** Final text, frozen at approval time. */
		renderedBody: string;
		/** Uppercase resident name: printed upright inside the italic body, as on paper. */
		residentName: string;
		validityNote: string;
	};
	signers: CertificatePdfSigner[];
}

/** Fonts are PDF standard fonts: nothing to embed, and they match the paper originals. */
export const PDF_FONTS = {
	Helvetica: {
		normal: 'Helvetica',
		bold: 'Helvetica-Bold',
		italics: 'Helvetica-Oblique',
		bolditalics: 'Helvetica-BoldOblique'
	},
	Times: {
		normal: 'Times-Roman',
		bold: 'Times-Bold',
		italics: 'Times-Italic',
		bolditalics: 'Times-BoldItalic'
	}
};

/** "La presente tendrá vigencia por seis (6) meses a partir de esta fecha." */
export function defaultValidityNote(months: number): string {
	const unit = months === 1 ? 'mes' : 'meses';
	const words = numberToSpanishWords(months, { masculineNoun: true });
	return `La presente tendrá vigencia por ${words} (${months}) ${unit} a partir de esta fecha.`;
}

/** "0294-3318046" → "0294 - 3318046", as written on the paper certificates. */
const spacedPhone = (phone: string) => phone.replace('-', ' - ');

/**
 * Splits the body so the resident's name is upright inside the italic paragraph. Punctuation
 * right after the name stays in the upright run: separate runs would let justification open a
 * gap before it ("NAME , venezolano").
 */
function bodyRuns(body: string, residentName: string): Content[] {
	if (!residentName || !body.includes(residentName)) return [{ text: body }];
	const escaped = residentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return body
		.split(new RegExp(`(${escaped}[,.;:]?)`))
		.filter((part) => part !== '')
		.map((part) =>
			part.startsWith(residentName) ? { text: part, italics: false } : { text: part }
		);
}

export function buildCertificateDocument(input: CertificatePdfInput): TDocumentDefinitions {
	const { council, certificate } = input;
	const headerLines = [
		'República Bolivariana de Venezuela',
		`Municipio ${council.municipality} – Parroquia ${council.parish} del Estado ${council.state}`,
		council.taxId ? `${council.name}   RIF. ${council.taxId}` : council.name
	];

	const signatureColumns: Content[] = input.signers.map((signer) => ({
		width: '*',
		alignment: 'center',
		fontSize: 12,
		lineHeight: 1.25,
		stack: [
			{
				canvas: [{ type: 'line', x1: 0, y1: 0, x2: 130, y2: 0, lineWidth: 0.7 }],
				margin: [0, 0, 0, 4]
			},
			{ text: signer.shortName },
			{ text: signer.roleTitle },
			...(signer.phone ? [{ text: `Tlf: ${spacedPhone(signer.phone)}` }] : [])
		]
	}));

	return {
		pageSize: 'A4',
		pageMargins: [85, 50, 85, 50],
		info: {
			title: `${certificate.title} N.º ${certificate.serialNumber}`,
			author: council.name,
			subject: certificate.title
		},
		defaultStyle: { font: 'Helvetica', fontSize: 12 },
		content: [
			{
				stack: headerLines,
				font: 'Times',
				fontSize: 14,
				alignment: 'center',
				lineHeight: 1.2
			},
			council.logoDataUrl
				? { image: council.logoDataUrl, fit: [290, 72], alignment: 'center', margin: [0, 12, 0, 8] }
				: { text: '', margin: [0, 12, 0, 0] },
			{
				text: certificate.title.toLocaleUpperCase('es-VE'),
				italics: true,
				alignment: 'center',
				margin: [0, 6, 0, 12]
			},
			{
				text: bodyRuns(certificate.renderedBody, certificate.residentName),
				italics: true,
				alignment: 'justify',
				lineHeight: 1.85
			},
			{
				text: `Por el ${council.name}`,
				italics: true,
				fontSize: 14,
				alignment: 'center',
				margin: [0, 10, 0, 48]
			},
			{ columns: signatureColumns, columnGap: 12 },
			{ text: `Nota: ${certificate.validityNote}`, fontSize: 11, margin: [0, 28, 0, 0] }
		]
	};
}

/** Generates the certificate PDF in the browser. */
export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Blob> {
	const [{ default: pdfMake }, { default: helvetica }, { default: times }] = await Promise.all([
		import('pdfmake/build/pdfmake'),
		// @ts-expect-error -- font containers ship without type declarations
		import('pdfmake/build/standard-fonts/Helvetica'),
		// @ts-expect-error -- font containers ship without type declarations
		import('pdfmake/build/standard-fonts/Times')
	]);
	pdfMake.addFontContainer(helvetica);
	pdfMake.addFontContainer(times);
	return pdfMake.createPdf(buildCertificateDocument(input)).getBlob();
}
