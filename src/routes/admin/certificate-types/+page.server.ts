import { getDb } from '#lib/server/bindings.ts';
import { listCertificateTypesForAdmin } from '#lib/server/certificateTypes.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	certificateTypes: await listCertificateTypesForAdmin(getDb())
});
