<script lang="ts">
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.dashboard;
</script>

<svelte:head>
	<title>{es.admin.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>

{#if data.sampleData.council || data.sampleData.signers}
	<div class="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900" role="status">
		<p>{t.sampleData}</p>
		<ul class="mt-2 list-inside list-disc text-sm">
			{#if data.sampleData.council}
				<li>
					<a href={resolve('/admin/settings')} class="underline">{t.sampleCouncil}</a>
				</li>
			{/if}
			{#if data.sampleData.signers}
				<li>
					<a href={resolve('/admin/signers')} class="underline">{t.sampleSigners}</a>
				</li>
			{/if}
		</ul>
	</div>
{/if}
{#if !data.turnstileEnabled}
	<p class="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900" role="status">
		{t.turnstileOff}
	</p>
{/if}
<div class="mt-6 grid gap-4 sm:grid-cols-3">
	{#each [{ label: t.pending, value: data.counts.pending }, { label: t.approved, value: data.counts.approved }, { label: t.rejected, value: data.counts.rejected }] as stat (stat.label)}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<p class="text-sm text-slate-500">{stat.label}</p>
			<p class="mt-1 text-3xl font-semibold">{stat.value}</p>
		</div>
	{/each}
</div>
