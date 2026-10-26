<script lang="ts">
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.certificateTypes;
</script>

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>
<p class="mt-1 max-w-2xl text-slate-600">{t.description}</p>

<ul class="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
	{#each data.certificateTypes as type (type.id)}
		<li class="flex flex-wrap items-center gap-4 p-4" class:opacity-60={!type.is_active}>
			<div class="min-w-48 flex-1">
				<p class="font-medium">
					{type.title}
					<span
						class="ml-2 rounded-full px-2 py-0.5 text-xs font-normal {type.is_active
							? 'bg-green-100 text-green-800'
							: 'bg-slate-200'}"
					>
						{type.is_active ? t.active : t.inactive}
					</span>
				</p>
				<p class="text-sm text-slate-500">
					{t.updatedAt}
					{formatDate(type.updated_at)}
					{#if type.pending_count > 0}
						· {t.pendingCount.replace('{n}', String(type.pending_count))}
					{/if}
				</p>
			</div>
			<a
				href={resolve('/admin/certificate-types/[id]', { id: type.id })}
				class="text-sm text-blue-700 hover:underline"
				aria-label="{t.edit}: {type.title}"
			>
				{t.edit}
			</a>
		</li>
	{/each}
</ul>
