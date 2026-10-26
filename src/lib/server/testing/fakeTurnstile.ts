// Test-only stand-in for Turnstile's siteverify endpoint, passed as `fetcher`.
import { TURNSTILE_VERIFY_URL } from '../turnstile.ts';

type Outcome = 'success' | 'failure' | 'http_error' | 'network_error' | 'bad_json';

export function fakeTurnstile(outcome: Outcome = 'success') {
	const calls: { url: string; form: Record<string, string> }[] = [];
	const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const form = Object.fromEntries(
			[...((init?.body as FormData | undefined)?.entries() ?? [])].map(([k, v]) => [k, String(v)])
		);
		calls.push({ url: String(input), form });
		if (String(input) !== TURNSTILE_VERIFY_URL) throw new Error(`Unexpected URL ${String(input)}`);
		switch (outcome) {
			case 'network_error':
				throw new TypeError('fetch failed');
			case 'http_error':
				return new Response('oops', { status: 500 });
			case 'bad_json':
				return new Response('<html>', { status: 200 });
			default:
				return Response.json({
					success: outcome === 'success',
					'error-codes': outcome === 'success' ? [] : ['invalid-input-response']
				});
		}
	}) as typeof fetch;
	return { fetcher, calls };
}
