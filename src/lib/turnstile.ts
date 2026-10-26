// Loads the Cloudflare Turnstile script once, in explicit-render mode (browser only).
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export interface TurnstileApi {
	render(
		container: HTMLElement,
		options: { sitekey: string; language?: string }
	): string | undefined;
	reset(widgetId: string): void;
	remove(widgetId: string): void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

let loading: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
	if (window.turnstile) return Promise.resolve(window.turnstile);
	loading ??= new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = SCRIPT_URL;
		script.onload = () =>
			window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable'));
		script.onerror = () => {
			loading = null;
			script.remove();
			reject(new Error('Turnstile failed to load'));
		};
		document.head.appendChild(script);
	});
	return loading;
}
