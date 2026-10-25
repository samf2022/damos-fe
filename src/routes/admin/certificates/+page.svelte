<script lang="ts">
	import { resolve } from '$app/paths';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.certificates;

	const tabs = [
		{ status: 'pending', label: es.certificateStatus.pending },
		{ status: 'approved', label: es.certificateStatus.approved },
		{ status: 'rejected', label: es.certificateStatus.rejected },
		{ status: 'all', label: t.all }
	] as const;

	const listUrl = (params: { status?: string; q?: string; page?: number }) => {
		const status = params.status ?? data.filters.status;
		const q = params.q ?? data.filters.q;
		const query = [
			status !== 'pending' && `status=${encodeURIComponent(status)}`,
			q && `q=${encodeURIComponent(q)}`,
			params.page && params.page > 1 && `page=${params.page}`
		]
			.filter(Boolean)
			.join('&');
		return `${resolve('/admin/certificates')}${query ? `?${query}` : ''}`;
	};
</script>

<!-- listUrl() builds on resolve(); the rule can't see through the helper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>

<nav class="mt-6 flex flex-wrap gap-2" aria-label={t.title}>
	{#each tabs as tab (tab.status)}
		<a
			href={listUrl({ status: tab.status, page: 1 })}
			class="rounded-full border px-3 py-1 text-sm {data.filters.status === tab.status
				? 'border-blue-700 bg-blue-700 text-white'
				: 'border-slate-300 bg-white hover:bg-slate-100'}"
			aria-current={data.filters.status === tab.status ? 'page' : undefined}
		>
			{tab.label}
			<span class="ml-1 opacity-75">{data.counts[tab.status]}</span>
		</a>
	{/each}
</nav>

<form method="GET" class="mt-4 flex max-w-lg gap-2">
	{#if data.filters.status !== 'pending'}
		<input type="hidden" name="status" value={data.filters.status} />
	{/if}
	<label class="sr-only" for="q">{t.searchLabel}</label>
	<input
		id="q"
		name="q"
		value={data.filters.q}
		placeholder={t.searchPlaceholder}
		class="block w-full rounded-md border-slate-300"
	/>
	<button class="rounded-md border border-slate-300 bg-white px-4 hover:bg-slate-100">
		{t.search}
	</button>
</form>

{#if data.certificates.length === 0}
	<p class="mt-6 text-slate-500">{t.empty}</p>
{:else}
	<div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-slate-200 bg-slate-50 text-slate-600">
				<tr>
					<th class="px-3 py-2 font-medium">{t.columns.resident}</th>
					<th class="px-3 py-2 font-medium">{t.columns.type}</th>
					<th class="px-3 py-2 font-medium">{t.columns.status}</th>
					<th class="px-3 py-2 font-medium">{t.columns.submittedAt}</th>
					<th class="px-3 py-2 font-medium">{t.columns.serial}</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-200">
				{#each data.certificates as certificate (certificate.id)}
					<tr class="hover:bg-slate-50">
						<td class="px-3 py-2">
							<a
								href={resolve('/admin/certificates/[id]', { id: certificate.id })}
								class="font-medium text-blue-700 hover:underline"
							>
								{certificate.resident_name}
							</a>
							<span class="block text-slate-500">{certificate.national_id}</span>
						</td>
						<td class="px-3 py-2">{certificate.type_title}</td>
						<td class="px-3 py-2"><StatusBadge status={certificate.status} /></td>
						<td class="px-3 py-2 whitespace-nowrap">{formatDate(certificate.submitted_at)}</td>
						<td class="px-3 py-2 whitespace-nowrap">{certificate.serial_number ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.pageCount > 1}
		<nav class="mt-4 flex items-center gap-4 text-sm">
			{#if data.page > 1}
				<a href={listUrl({ page: data.page - 1 })} class="text-blue-700 hover:underline">
					← {t.previous}
				</a>
			{/if}
			<span class="text-slate-500">{data.page} / {data.pageCount}</span>
			{#if data.page < data.pageCount}
				<a href={listUrl({ page: data.page + 1 })} class="text-blue-700 hover:underline">
					{t.next} →
				</a>
			{/if}
		</nav>
	{/if}
{/if}
