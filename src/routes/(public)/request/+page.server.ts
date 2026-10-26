import { fail, redirect } from '@sveltejs/kit';
import { getDb, getTurnstileConfig } from '#lib/server/bindings.ts';
import { submitCertificateRequest } from '#lib/server/certificateRequests.ts';
import type { CertificateTypeRow } from '#lib/server/db.ts';
import { guardPublicRequest } from '#lib/server/requestGuard.ts';
import { TURNSTILE_RESPONSE_FIELD } from '#lib/server/turnstile.ts';
import { es } from '#lib/i18n/es.ts';
import {
	readRequestValues,
	validateCertificateRequest,
	type RequestErrors
} from '#lib/validation/certificateRequest.ts';
import type { Actions, PageServerLoad } from './$types';

/** Hidden field real users never fill in; bots that fill every input get a fake success. */
const HONEYPOT_FIELD = 'website';

export const load: PageServerLoad = async ({ url }) => {
	const certificateTypes = await getDb().all<Pick<CertificateTypeRow, 'id' | 'code' | 'title'>>(
		'SELECT id, code, title FROM certificate_types WHERE is_active = 1 ORDER BY title'
	);
	// `?tipo=residence` comes from the type cards on the home page.
	const tipo = url.searchParams.get('tipo');
	return {
		certificateTypes,
		preselectedTypeId: certificateTypes.find((type) => type.code === tipo)?.id ?? null,
		turnstileSiteKey: getTurnstileConfig()?.siteKey ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const form = await request.formData();
		if (form.get(HONEYPOT_FIELD)) redirect(303, '/request/sent');

		const db = getDb();
		const guard = await guardPublicRequest(db, {
			ip: getClientAddress(),
			turnstileToken: form.get(TURNSTILE_RESPONSE_FIELD)?.toString() ?? null,
			turnstile: getTurnstileConfig()
		});
		if (!guard.ok) {
			const rateLimited = guard.reason === 'rate_limited';
			return fail(rateLimited ? 429 : 400, {
				values: readRequestValues(form),
				errors: {} as RequestErrors,
				message: rateLimited ? es.request.tooManyRequests : es.request.captchaFailed
			});
		}

		const result = validateCertificateRequest(form);
		if (!result.ok) {
			return fail(400, {
				values: result.values,
				errors: result.errors,
				message: es.request.fixErrors
			});
		}

		const submitted = await submitCertificateRequest(db, result.data);
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
