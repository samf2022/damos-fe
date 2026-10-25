<script lang="ts">
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.dashboard;
</script>

<svelte:head>
	<title>{es.admin.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>
<div class="mt-6 grid gap-4 sm:grid-cols-3">
	{#each [{ label: t.pending, value: data.counts.pending }, { label: t.approved, value: data.counts.approved }, { label: t.rejected, value: data.counts.rejected }] as stat (stat.label)}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<p class="text-sm text-slate-500">{stat.label}</p>
			<p class="mt-1 text-3xl font-semibold">{stat.value}</p>
		</div>
	{/each}
</div>
