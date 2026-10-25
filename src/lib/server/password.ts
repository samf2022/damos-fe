// PBKDF2 password hashing with WebCrypto. Works in Cloudflare Workers and Node >= 20.
// Kept free of imports so scripts/create-admin.ts can run it directly with Node.

const ALGORITHM = 'pbkdf2-sha256';
/** Cloudflare Workers caps PBKDF2 at 100 000 iterations. */
export const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

export interface PasswordHash {
	/** `pbkdf2-sha256$<iterations>$<base64 hash>`, so parameters can change later. */
	hash: string;
	/** Base64-encoded random salt. */
	salt: string;
}

function toBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function derive(
	password: string,
	salt: Uint8Array<ArrayBuffer>,
	iterations: number
): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password.normalize('NFKC')),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
		key,
		KEY_LENGTH_BITS
	);
	return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

export async function hashPassword(password: string): Promise<PasswordHash> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const derived = await derive(password, salt, PBKDF2_ITERATIONS);
	return {
		hash: `${ALGORITHM}$${PBKDF2_ITERATIONS}$${toBase64(derived)}`,
		salt: toBase64(salt)
	};
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
	const [algorithm, iterationsText, expected] = stored.hash.split('$');
	const iterations = Number(iterationsText);
	if (algorithm !== ALGORITHM || !Number.isInteger(iterations) || iterations <= 0 || !expected) {
		return false;
	}
	try {
		const derived = await derive(password, fromBase64(stored.salt), iterations);
		return timingSafeEqual(derived, fromBase64(expected));
	} catch {
		// Malformed base64 in the stored row.
		return false;
	}
}
