<script lang="ts">
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.verify;

	const state = $derived(
		{
			valid: {
				title: t.valid,
				hint: t.validHint,
				box: 'border-green-600 bg-green-50 text-green-900',
				icon: 'M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z'
			},
			expired: {
				title: t.expired,
				hint: t.expiredHint,
				box: 'border-amber-500 bg-amber-50 text-amber-900',
				icon: 'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 4a1 1 0 1 0-2 0v4a1 1 0 0 0 .3.7l2.5 2.5a1 1 0 0 0 1.4-1.4L11 9.6V6Z'
			},
			not_issued: {
				title: t.notIssued,
				hint: t.notIssuedHint,
				box: 'border-slate-400 bg-slate-100 text-slate-800',
				icon: 'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 8.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z'
			}
		}[data.validity]
	);
</script>

<svelte:head>
	<title>{t.title} · {data.council?.name ?? es.app.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>

<div class="mt-6 flex gap-3 rounded-xl border-2 p-4 {state.box}" role="status">
	<svg class="size-7 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
		<path fill-rule="evenodd" d={state.icon} clip-rule="evenodd" />
	</svg>
	<div>
		<p class="text-lg font-semibold">{state.title}</p>
		<p class="mt-0.5 text-sm">{state.hint}</p>
	</div>
</div>

<dl
	class="mt-6 grid gap-x-6 gap-y-3 rounded-xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-[max-content_1fr]"
>
	<dt class="text-sm text-slate-500">{t.holder}</dt>
	<dd class="font-medium">{data.holderName}</dd>
	<dt class="text-sm text-slate-500">{t.type}</dt>
	<dd>{data.typeTitle}</dd>
	{#if data.council}
		<dt class="text-sm text-slate-500">{t.issuedBy}</dt>
		<dd>{data.council.name}</dd>
	{/if}
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
<p class="mt-4 text-sm text-slate-500">{t.privacy}</p>
