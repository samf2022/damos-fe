<script lang="ts">
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.admin.certificates;
</script>

<svelte:head>
	<title>{t.detailTitle} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.detailTitle}</h1>
<p class="mt-2 text-slate-600">{es.admin.placeholder}</p>

<dl class="mt-6 grid gap-2 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
	<dt class="text-sm text-slate-500">{es.verify.holder}</dt>
	<dd>{data.resident.firstNames} {data.resident.lastNames}</dd>
	<dt class="text-sm text-slate-500">{es.request.resident.nationalId}</dt>
	<dd>{data.resident.nationalId}</dd>
	<dt class="text-sm text-slate-500">{es.verify.type}</dt>
	<dd>{data.certificate.type_title}</dd>
	<dt class="text-sm text-slate-500">{es.verify.status}</dt>
	<dd>{es.certificateStatus[data.certificate.status]}</dd>
</dl>
