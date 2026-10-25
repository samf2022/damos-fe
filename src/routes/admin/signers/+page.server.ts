import { fail } from '@sveltejs/kit';
import { getDb } from '#lib/server/bindings.ts';
import { listCertificateTypes, listSigners, setSignerActive } from '#lib/server/signers.ts';
import { es } from '#lib/i18n/es.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = getDb();
	const [signers, certificateTypes] = await Promise.all([
		listSigners(db),
		listCertificateTypes(db)
	]);
	return { signers, certificateTypes };
};

const toggle =
	(active: boolean): Actions[string] =>
	async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const changed = await setSignerActive(getDb(), id, active, locals.user!.id);
		if (!changed) return fail(404, { message: es.admin.signers.notFound });
	};

export const actions: Actions = {
	deactivate: toggle(false),
	activate: toggle(true)
};
