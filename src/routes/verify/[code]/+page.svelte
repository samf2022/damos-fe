<script lang="ts">
	import PublicShell from '#lib/components/PublicShell.svelte';
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.verify;

	const banner = $derived(
		{
			valid: { text: t.valid, class: 'bg-green-50 text-green-900' },
			expired: { text: t.expired, class: 'bg-amber-50 text-amber-900' },
			not_issued: { text: t.notIssued, class: 'bg-slate-100 text-slate-800' }
		}[data.validity]
	);
</script>

<PublicShell>
	<h1 class="text-2xl font-bold">{t.title}</h1>
	<p class="mt-4 rounded-md p-3 font-medium {banner.class}">{banner.text}</p>

	<dl class="mt-6 grid gap-3 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
		<dt class="text-sm text-slate-500">{t.holder}</dt>
		<dd>{data.holderName}</dd>
		<dt class="text-sm text-slate-500">{t.type}</dt>
		<dd>{data.typeTitle}</dd>
		<dt class="text-sm text-slate-500">{t.status}</dt>
		<dd>{es.certificateStatus[data.status]}</dd>
		{#if data.issuedAt}
			<dt class="text-sm text-slate-500">{t.issuedAt}</dt>
			<dd>{formatDate(data.issuedAt)}</dd>
		{/if}
		{#if data.expiresAt}
			<dt class="text-sm text-slate-500">{t.expiresAt}</dt>
			<dd>{formatDate(data.expiresAt)}</dd>
		{/if}
	</dl>
</PublicShell>
