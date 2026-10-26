import { error, fail } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import { getCertificateTypeEditor, saveCertificateType } from '#lib/server/certificateTypes.ts';
import { es } from '#lib/i18n/es.ts';
import { defaultValidityNote } from '#lib/pdf/generateCertificatePdf.ts';
import { validateCertificateType } from '#lib/validation/certificateType.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const editor = await getCertificateTypeEditor(getDb(), params.id);
	if (!editor) error(404, es.admin.certificateTypes.notFound);
	const { council } = editor;
	return {
		...editor,
		validityNote: council
			? council.validity_note || defaultValidityNote(council.validity_months)
			: null
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const result = validateCertificateType(await request.formData());
		if (!result.ok) {
			return fail(400, { errors: result.errors, problems: result.problems, values: result.values });
		}
		const saved = await saveCertificateType(getDb(), params.id, result.data, locals.user!.id);
		if (!saved.ok) {
			if (saved.reason === 'not_found') error(404, es.admin.certificateTypes.notFound);
			return fail(400, {
				values: {
					title: result.data.title,
					body_template: result.data.bodyTemplate,
					is_active: false
				},
				message: es.admin.certificateTypes.lastActive
			});
		}
		return { saved: true };
	}
};
