<script lang="ts">
	// Cloudflare Turnstile widget. Inside a <form> it adds the hidden `cf-turnstile-response`
	// field itself. Tokens are single-use: change `resetKey` after each submit to get a new one.
	import { onMount } from 'svelte';
	import { loadTurnstile } from '#lib/turnstile.ts';

	let {
		siteKey,
		label,
		unavailableMessage,
		resetKey = 0
	}: { siteKey: string; label: string; unavailableMessage: string; resetKey?: number } = $props();

	let container: HTMLDivElement;
	let widgetId = $state<string | null>(null);
	let unavailable = $state(false);

	onMount(() => {
		let destroyed = false;
		loadTurnstile()
			.then((turnstile) => {
				if (destroyed) return;
				widgetId = turnstile.render(container, { sitekey: siteKey, language: 'es' }) ?? null;
			})
			.catch(() => {
				unavailable = true;
			});
		return () => {
			destroyed = true;
			if (widgetId) window.turnstile?.remove(widgetId);
		};
	});

	$effect(() => {
		if (resetKey && widgetId) window.turnstile?.reset(widgetId);
	});
</script>

<div bind:this={container} role="group" aria-label={label} class="min-h-[65px]">
	{#if unavailable}
		<p class="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{unavailableMessage}</p>
	{/if}
</div>
