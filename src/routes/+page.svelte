<script lang="ts">
	import { resolve } from '$app/paths';
	import PublicShell from '#lib/components/PublicShell.svelte';
	import { es } from '#lib/i18n/es.ts';
</script>

<PublicShell>
	<h1 class="text-2xl font-bold">{es.home.title}</h1>
	<p class="mt-2 text-slate-600">{es.home.description}</p>
	<a
		href={resolve('/request')}
		class="mt-6 inline-block rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
	>
		{es.home.cta}
	</a>
</PublicShell>
