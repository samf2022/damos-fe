import { getDb } from '#lib/server/bindings.ts';
import { listResidents, RESIDENTS_PAGE_SIZE } from '#lib/server/residents.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const { residents, total } = await listResidents(getDb(), { q, page });
	return {
		residents,
		q,
		page,
		pageCount: Math.max(1, Math.ceil(total / RESIDENTS_PAGE_SIZE))
	};
};
