import { error, fail, redirect } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import { getSigner, listCertificateTypes, saveSigner } from '#lib/server/signers.ts';
import { es } from '#lib/i18n/es.ts';
import { validateSigner } from '#lib/validation/signer.ts';
import type { Actions, PageServerLoad } from './$types';

const isNew = (id: string) => id === 'new';

export const load: PageServerLoad = async ({ params }) => {
	const db = getDb();
	const [signer, certificateTypes] = await Promise.all([
		isNew(params.id) ? null : getSigner(db, params.id),
		listCertificateTypes(db)
	]);
	if (!isNew(params.id) && !signer) error(404, es.admin.signers.notFound);
	return { signer, certificateTypes };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const result = validateSigner(await request.formData());
		if (!result.ok) return fail(400, { errors: result.errors, values: result.values });

		const saved = await saveSigner(
			getDb(),
			result.data,
			locals.user!.id,
			isNew(params.id) ? undefined : params.id
		);
		if (!saved.ok) error(404, es.admin.signers.notFound);
		redirect(303, '/admin/signers');
	}
};
