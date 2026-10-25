// Client-side PDF generation with pdfmake. Import this module only from browser code
// (e.g. inside an event handler or `onMount`), never from `+page.server.ts`.
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export interface CertificatePdfSigner {
	fullName: string;
	shortName: string;
	nationalId?: string;
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
		/** Data URL of the logo fetched from R2, if any. */
		logoDataUrl: string | null;
	};
	certificate: {
		title: string;
		serialNumber: string;
		/** Final text, already rendered from the template and frozen at approval time. */
		renderedBody: string;
		issuedAt: string;
		expiresAt: string;
		validityNote: string | null;
		/** Public URL encoded in the QR code (`/verify/[code]`). */
		verificationUrl: string;
	};
	signers: CertificatePdfSigner[];
}

/** Builds the pdfmake document definition. Kept pure so it can be unit-tested. */
export function buildCertificateDocument(input: CertificatePdfInput): TDocumentDefinitions {
	// TODO(next milestone): final layout — letterhead with logo and council data, title,
	// justified body, signature blocks in columns, verification QR and validity footer.
	return {
		pageSize: 'LETTER',
		info: { title: `${input.certificate.title} ${input.certificate.serialNumber}` },
		content: [
			{ text: input.council.name, bold: true },
			{ text: input.certificate.title, bold: true, margin: [0, 16] },
			{ text: input.certificate.renderedBody, alignment: 'justify' },
			{ qr: input.certificate.verificationUrl, fit: 80, margin: [0, 24] }
		]
	};
}

/** Generates the certificate PDF in the browser. */
export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Blob> {
	// TODO(next milestone): implement with pdfmake, loaded lazily so it stays out of the
	// main bundle:
	//   const { default: pdfMake } = await import('pdfmake/build/pdfmake');
	//   const { default: fonts } = await import('pdfmake/build/vfs_fonts');
	//   pdfMake.addVirtualFileSystem(fonts);
	//   return pdfMake.createPdf(buildCertificateDocument(input)).getBlob();
	void buildCertificateDocument(input);
	throw new Error('generateCertificatePdf is not implemented yet');
}
