import { error, fail } from '@sveltejs/kit';
import { getAppUrl, getDb } from '#lib/server/bindings.ts';
import {
	approveCertificate,
	getReviewData,
	rejectCertificate
} from '#lib/server/certificateReview.ts';
import { es } from '#lib/i18n/es.ts';
import type { Actions, PageServerLoad } from './$types';

const MIN_REASON_LENGTH = 5;
const MAX_TEXT_LENGTH = 500;

export const load: PageServerLoad = async ({ params }) => {
	const data = await getReviewData(getDb(), params.id);
	if (!data) error(404, es.errors.notFound);

	const { certificate } = data;
	return {
		...data,
		verificationUrl: certificate.verification_code
			? new URL(`/verify/${certificate.verification_code}`, getAppUrl()).toString()
			: null
	};
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
