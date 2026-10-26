import { describe, expect, it } from 'vitest';
import { fakeTurnstile } from './testing/fakeTurnstile';
import { verifyTurnstile } from './turnstile';

describe('verifyTurnstile', () => {
	it('sends the secret, token and IP and accepts a successful answer', async () => {
		const { fetcher, calls } = fakeTurnstile('success');
		const ok = await verifyTurnstile('token-abc', {
			secretKey: 'secret',
			remoteIp: '198.51.100.7',
			fetcher
		});
		expect(ok).toBe(true);
		expect(calls[0].form).toEqual({
			secret: 'secret',
			response: 'token-abc',
			remoteip: '198.51.100.7'
		});
	});

	it.each(['failure', 'http_error', 'network_error', 'bad_json'] as const)(
		'fails closed on %s',
		async (outcome) => {
			const { fetcher } = fakeTurnstile(outcome);
			expect(await verifyTurnstile('token-abc', { secretKey: 'secret', fetcher })).toBe(false);
		}
	);

	it('rejects missing or oversized tokens without calling Cloudflare', async () => {
		const { fetcher, calls } = fakeTurnstile('success');
		expect(await verifyTurnstile(null, { secretKey: 's', fetcher })).toBe(false);
		expect(await verifyTurnstile('', { secretKey: 's', fetcher })).toBe(false);
		expect(await verifyTurnstile('x'.repeat(2049), { secretKey: 's', fetcher })).toBe(false);
		expect(calls).toHaveLength(0);
	});
});
