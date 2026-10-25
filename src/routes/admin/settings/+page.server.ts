import { fail } from '@sveltejs/kit';
import { getDb, getFilesBucket } from '#lib/server/bindings.ts';
import {
	getCouncilSettings,
	removeLogo,
	replaceLogo,
	saveCouncilSettings
} from '#lib/server/councilSettings.ts';
import { es } from '#lib/i18n/es.ts';
import { validateCouncilSettings } from '#lib/validation/councilSettings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	settings: await getCouncilSettings(getDb())
});

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const result = validateCouncilSettings(await request.formData());
		if (!result.ok) {
			return fail(400, { action: 'save' as const, errors: result.errors, values: result.values });
		}
		await saveCouncilSettings(getDb(), result.data, locals.user!.id);
		return { action: 'save' as const, message: es.admin.settings.saved };
	},

	uploadLogo: async ({ request, locals }) => {
		const file = (await request.formData()).get('logo');
		const result = await replaceLogo(
			getDb(),
			getFilesBucket(),
			file instanceof File ? file : null,
			locals.user!.id
		);
		if (!result.ok) {
			return fail(400, {
				action: 'logo' as const,
				error: es.admin.settings.logo.errors[result.reason]
			});
		}
		return { action: 'logo' as const, message: es.admin.settings.logo.uploaded };
	},

	removeLogo: async ({ locals }) => {
		await removeLogo(getDb(), getFilesBucket(), locals.user!.id);
		return { action: 'logo' as const, message: es.admin.settings.logo.removed };
	}
};
