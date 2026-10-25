import { error, fail } from '@sveltejs/kit';
import { getAppUrl, getDb, getFilesBucket } from '#lib/server/bindings.ts';
import {
	certificatePdfFileName,
	markWhatsAppSent,
	storeCertificatePdf
} from '#lib/server/certificatePdf.ts';
import {
	approveCertificate,
	getReviewData,
	rejectCertificate
} from '#lib/server/certificateReview.ts';
import { es } from '#lib/i18n/es.ts';
import { defaultValidityNote, type CertificatePdfInput } from '#lib/pdf/generateCertificatePdf.ts';
import { toUpperName } from '#lib/text/formatting.ts';
import type { Actions, PageServerLoad } from './$types';

const MIN_REASON_LENGTH = 5;
const MAX_TEXT_LENGTH = 500;

export const load: PageServerLoad = async ({ params }) => {
	const data = await getReviewData(getDb(), params.id);
	if (!data) error(404, es.errors.notFound);

	const { certificate, council, snapshot } = data;
	const verificationUrl = certificate.verification_code
		? new URL(`/verify/${certificate.verification_code}`, getAppUrl()).toString()
		: null;

	// Everything the browser needs to build the PDF, except the logo (fetched as a data URL).
	const pdf =
		certificate.status === 'approved' && council && verificationUrl && certificate.serial_number
			? {
					input: {
						council: {
							name: council.name,
							taxId: council.tax_id,
							state: council.state,
							municipality: council.municipality,
							parish: council.parish
						},
						certificate: {
							title: certificate.type_title,
							serialNumber: certificate.serial_number,
							renderedBody: certificate.rendered_body ?? '',
							residentName: toUpperName(`${snapshot.firstNames} ${snapshot.lastNames}`),
							validityNote: council.validity_note || defaultValidityNote(council.validity_months),
							verificationUrl
						},
						signers: data.issuedSigners.map((signer) => ({
							shortName: signer.short_name,
							roleTitle: signer.role_title,
							phone: signer.phone
						}))
					} satisfies Omit<CertificatePdfInput, 'council'> & {
						council: Omit<CertificatePdfInput['council'], 'logoDataUrl'>;
					},
					logoKey: council.logo_r2_key,
					fileName: certificatePdfFileName(certificate.serial_number),
					whatsappMessage: es.admin.review.document.message
						.replace('{name}', snapshot.firstNames)
						.replace('{council}', council.name)
						.replace('{type}', certificate.type_title.toLocaleLowerCase('es-VE'))
						.replace('{serial}', certificate.serial_number)
						.replace('{url}', verificationUrl)
				}
			: null;

	return { ...data, verificationUrl, pdf };
};

const text = (form: FormData, name: string) =>
	String(form.get(name) ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, MAX_TEXT_LENGTH);

export const actions: Actions = {
	approve: async ({ request, params, locals }) => {
		const form = await request.formData();
		const knownSinceText = text(form, 'known_since_text');
		const signerIds = form.getAll('signer_ids').map(String);
		if (!knownSinceText) {
			return fail(400, {
				action: 'approve' as const,
				message: es.admin.review.errors.known_since_required
			});
		}

		const result = await approveCertificate(getDb(), {
			certificateId: params.id,
			reviewerId: locals.user!.id,
			signerIds,
			knownSinceText,
			updateResident: form.get('update_resident') === 'on'
		});
		if (!result.ok) {
			const message = es.admin.review.errors[result.reason];
			return fail(result.reason === 'already_reviewed' ? 409 : 400, {
				action: 'approve' as const,
				message: result.missing ? `${message} ${result.missing.join(', ')}` : message
			});
		}
		return { action: 'approve' as const, success: true };
	},

	savePdf: async ({ request, params, locals }) => {
		const file = (await request.formData()).get('pdf');
		const result = await storeCertificatePdf(
			getDb(),
			getFilesBucket(),
			params.id,
			file instanceof File ? file : null,
			locals.user!.id
		);
		if (!result.ok) {
			return fail(400, {
				action: 'pdf' as const,
				message: es.admin.review.document.errors[result.reason]
			});
		}
		return { action: 'pdf' as const, success: true };
	},

	markWhatsAppSent: async ({ params, locals }) => {
		await markWhatsAppSent(getDb(), params.id, locals.user!.id);
		return { action: 'whatsapp' as const, success: true };
	},

	reject: async ({ request, params, locals }) => {
		const form = await request.formData();
		const reason = text(form, 'rejection_reason');
		if (reason.length < MIN_REASON_LENGTH) {
			return fail(400, {
				action: 'reject' as const,
				message: es.admin.review.errors.reason_required,
				reason
			});
		}

		const result = await rejectCertificate(getDb(), {
			certificateId: params.id,
			reviewerId: locals.user!.id,
			reason
		});
		if (!result.ok) {
			return fail(result.reason === 'already_reviewed' ? 409 : 404, {
				action: 'reject' as const,
				message: es.admin.review.errors[result.reason],
				reason
			});
		}
		return { action: 'reject' as const, success: true };
	}
};
