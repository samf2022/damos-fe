// Cloudflare Turnstile (free CAPTCHA alternative) server-side verification.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Hidden field the widget adds to the form. */
export const TURNSTILE_RESPONSE_FIELD = 'cf-turnstile-response';
/** Tokens are at most 2048 characters. */
const MAX_TOKEN_LENGTH = 2048;

export interface TurnstileConfig {
	siteKey: string;
	secretKey: string;
}

/** Fails closed: a missing token, a network error or an unexpected answer count as "not human". */
export async function verifyTurnstile(
	token: string | null,
	options: { secretKey: string; remoteIp?: string; fetcher?: typeof fetch }
): Promise<boolean> {
	if (!token || token.length > MAX_TOKEN_LENGTH) return false;
	const body = new FormData();
	body.append('secret', options.secretKey);
	body.append('response', token);
	if (options.remoteIp) body.append('remoteip', options.remoteIp);
	try {
		const response = await (options.fetcher ?? fetch)(TURNSTILE_VERIFY_URL, {
			method: 'POST',
			body
		});
		if (!response.ok) return false;
		const outcome = (await response.json()) as { success?: unknown };
		return outcome.success === true;
	} catch {
		return false;
	}
}
