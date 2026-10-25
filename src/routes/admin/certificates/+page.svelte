<script lang="ts">
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.certificates;
</script>

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>
<p class="mt-2 text-slate-600">{es.admin.placeholder}</p>

{#if data.certificates.length === 0}
	<p class="mt-6 text-slate-500">{t.empty}</p>
{:else}
	<ul class="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
		{#each data.certificates as certificate (certificate.id)}
			<li>
				<a
					href={resolve('/admin/certificates/[id]', { id: certificate.id })}
					class="flex justify-between gap-4 p-3 hover:bg-slate-50"
				>
					<span>
						<span class="font-medium">{certificate.resident_name}</span>
						<span class="block text-sm text-slate-500">{certificate.type_title}</span>
					</span>
					<span class="text-right text-sm">
						{es.certificateStatus[certificate.status]}
						<span class="block text-slate-500">{formatDate(certificate.submitted_at)}</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
