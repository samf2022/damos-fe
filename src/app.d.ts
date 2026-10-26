// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SessionUser } from '#lib/server/auth.ts';

declare global {
	namespace App {
		// Bindings are not on `event.platform` in SvelteKit 3: use `#lib/server/bindings.ts`,
		// which reads them from `cloudflare:workers` (typed by `wrangler types`).

		interface Locals {
			user: SessionUser | null;
			sessionId: string | null;
		}

		// interface Error {}
		// interface PageData {}
		/** Shallow routing state: the public request form's current step (see `/request`). */
		interface PageState {
			step?: number;
			fromReview?: boolean;
		}
	}
}

export {};
