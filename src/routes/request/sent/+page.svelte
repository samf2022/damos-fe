<script lang="ts">
	import { resolve } from '$app/paths';
	import PublicShell from '#lib/components/PublicShell.svelte';
	import { es } from '#lib/i18n/es.ts';
</script>

<PublicShell>
	<h1 class="text-2xl font-bold">{es.requestSent.title}</h1>
	<p class="mt-2 text-slate-600">{es.requestSent.description}</p>
	<a href={resolve('/')} class="mt-6 inline-block text-blue-700 hover:underline"
		>{es.requestSent.back}</a
	>
</PublicShell>
