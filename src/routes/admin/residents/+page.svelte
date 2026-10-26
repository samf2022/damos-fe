<script lang="ts">
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.residents;

	const listUrl = (page: number) => {
		const query = [data.q && `q=${encodeURIComponent(data.q)}`, page > 1 && `page=${page}`]
			.filter(Boolean)
			.join('&');
		return `${resolve('/admin/residents')}${query ? `?${query}` : ''}`;
	};
</script>

<!-- listUrl() builds on resolve(); the rule can't see through the helper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>
<p class="mt-1 max-w-2xl text-slate-600">{t.description}</p>

<form method="GET" class="mt-4 flex max-w-lg gap-2">
	<label class="sr-only" for="q">{t.searchLabel}</label>
	<input
		id="q"
		name="q"
		type="search"
		value={data.q}
		placeholder={t.searchPlaceholder}
		class="block w-full rounded-md border-slate-300"
	/>
	<button class="rounded-md border border-slate-300 bg-white px-4 hover:bg-slate-100">
		{t.search}
	</button>
</form>

{#if data.residents.length === 0}
	<p class="mt-6 text-slate-500">{t.empty}</p>
{:else}
	<div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-slate-200 bg-slate-50 text-slate-600">
				<tr>
					<th class="px-3 py-2 font-medium">{t.columns.name}</th>
					<th class="px-3 py-2 font-medium">{t.columns.nationalId}</th>
					<th class="px-3 py-2 font-medium">{t.columns.phone}</th>
					<th class="px-3 py-2 font-medium">{t.columns.certificates}</th>
					<th class="px-3 py-2 font-medium">{t.columns.lastRequest}</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-200">
				{#each data.residents as resident (resident.id)}
					<tr class="hover:bg-slate-50">
						<td class="px-3 py-2">
							<a
								href={resolve('/admin/residents/[id]', { id: resident.id })}
								class="font-medium text-blue-700 hover:underline"
							>
								{resident.first_names}
								{resident.last_names}
							</a>
						</td>
						<td class="px-3 py-2 whitespace-nowrap">{resident.national_id}</td>
						<td class="px-3 py-2 whitespace-nowrap">{resident.phone ?? '—'}</td>
						<td class="px-3 py-2">{resident.certificate_count}</td>
						<td class="px-3 py-2 whitespace-nowrap">
							{resident.last_submitted_at ? formatDate(resident.last_submitted_at) : '—'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.pageCount > 1}
		<nav class="mt-4 flex items-center gap-4 text-sm">
			{#if data.page > 1}
				<a href={listUrl(data.page - 1)} class="text-blue-700 hover:underline">← {t.previous}</a>
			{/if}
			<span class="text-slate-500">
				{t.pageOf.replace('{page}', String(data.page)).replace('{pages}', String(data.pageCount))}
			</span>
			{#if data.page < data.pageCount}
				<a href={listUrl(data.page + 1)} class="text-blue-700 hover:underline">{t.next} →</a>
			{/if}
		</nav>
	{/if}
{/if}
