import { error } from '@sveltejs/kit';
import { es } from '#lib/i18n/es.ts';
import { getFilesBucket } from '#lib/server/bindings.ts';
import type { RequestHandler } from './$types';

/**
 * R2 key layout:
 * - `public/…`        — anyone (council logo).
 * - everything else   — admin session required (e.g. `certificates/<id>.pdf`).
 */
const PUBLIC_PREFIX = 'public/';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	const key = params.key;
	if (
		!key ||
		key.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
	) {
		error(400, es.errors.notFound);
	}

	const isPublic = key.startsWith(PUBLIC_PREFIX);
	if (!isPublic && !locals.user) error(401, es.errors.unauthorized);

	const object = await getFilesBucket().get(key, { onlyIf: request.headers });
	if (!object) error(404, es.errors.notFound);

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('ETag', object.httpEtag);
	headers.set('Cache-Control', isPublic ? 'public, max-age=3600' : 'private, no-store');
	headers.set('X-Content-Type-Options', 'nosniff');

	// `onlyIf` precondition matched: the client copy is still fresh.
	if (!('body' in object)) return new Response(null, { status: 304, headers });

	const fileName = key.split('/').at(-1)!;
	if (!headers.has('Content-Disposition')) {
		headers.set('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`);
	}
	return new Response(object.body, { headers });
};
