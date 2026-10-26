import { error, fail, redirect } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import { getResidentDetail, saveResident } from '#lib/server/residents.ts';
import { es } from '#lib/i18n/es.ts';
import { readValues, type FormErrors } from '#lib/validation/form.ts';
import { RESIDENT_FIELDS, validateResident, type ResidentField } from '#lib/validation/resident.ts';
import type { Actions, PageServerLoad } from './$types';

/** `?from=<certificate id>`: came from a request review, go back there after saving. */
const fromCertificate = (url: URL) => {
	const from = url.searchParams.get('from');
	return from && /^[0-9a-f-]{36}$/i.test(from) ? from : null;
};

export const load: PageServerLoad = async ({ params, url }) => {
	const detail = await getResidentDetail(getDb(), params.id);
	if (!detail) error(404, es.admin.residents.notFound);
	return { ...detail, from: fromCertificate(url) };
};

export const actions: Actions = {
	default: async ({ request, params, locals, url }) => {
		const form = await request.formData();
		const result = validateResident(form);
		if (!result.ok) return fail(400, { errors: result.errors, values: result.values });

		const saved = await saveResident(getDb(), params.id, result.data, locals.user!.id, {
			applyToPending: form.get('apply_to_pending') === 'on'
		});
		if (!saved.ok) {
			if (saved.reason === 'not_found') error(404, es.admin.residents.notFound);
			return fail(409, {
				errors: { national_id: 'duplicate_national_id' } as FormErrors<ResidentField>,
				values: readValues(form, RESIDENT_FIELDS)
			});
		}

		const from = fromCertificate(url);
		if (from) redirect(303, `/admin/certificates/${from}`);
		return { saved: true, updatedPending: saved.updatedPending };
	}
};
