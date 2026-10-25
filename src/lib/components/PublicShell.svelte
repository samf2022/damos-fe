<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { es } from '#lib/i18n/es.ts';

	let { children }: { children: Snippet } = $props();
</script>

<header class="border-b border-slate-200 bg-white">
	<nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
		<a href={resolve('/')} class="font-semibold">{es.app.name}</a>
		<a href={resolve('/request')} class="text-sm text-blue-700 hover:underline">{es.nav.request}</a>
	</nav>
</header>
<main class="mx-auto max-w-3xl px-4 py-8">
	{@render children()}
</main>
