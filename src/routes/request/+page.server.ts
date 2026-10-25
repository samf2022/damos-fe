import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import { submitCertificateRequest } from '#lib/server/certificateRequests.ts';
import type { CertificateTypeRow } from '#lib/server/db.ts';
import { es } from '#lib/i18n/es.ts';
import {
	readRequestValues,
	validateCertificateRequest,
	type RequestErrors
} from '#lib/validation/certificateRequest.ts';
import type { Actions, PageServerLoad } from './$types';

/** Hidden field real users never fill in; bots that fill every input get a fake success. */
const HONEYPOT_FIELD = 'website';

export const load: PageServerLoad = async () => {
	const certificateTypes = await getDb().all<Pick<CertificateTypeRow, 'id' | 'code' | 'title'>>(
		'SELECT id, code, title FROM certificate_types WHERE is_active = 1 ORDER BY title'
	);
	return { certificateTypes };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		if (form.get(HONEYPOT_FIELD)) redirect(303, '/request/sent');

		const result = validateCertificateRequest(form);
		if (!result.ok) {
			return fail(400, {
				values: result.values,
				errors: result.errors,
				message: es.request.fixErrors
			});
		}

		const submitted = await submitCertificateRequest(getDb(), result.data);
		if (!submitted.ok) {
			const values = readRequestValues(form);
			const duplicate = submitted.reason === 'duplicate_pending';
			const errors: RequestErrors = duplicate ? {} : { certificate_type_id: 'invalid_option' };
			return fail(duplicate ? 409 : 400, {
				values,
				errors,
				message: duplicate ? es.request.duplicatePending : es.request.typeUnavailable
			});
		}

		redirect(303, '/request/sent');
	}
};
