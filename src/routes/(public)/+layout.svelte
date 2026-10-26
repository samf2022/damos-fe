<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { es } from '#lib/i18n/es.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	const siteName = $derived(data.council?.name ?? es.app.name);
	const onRequest = $derived(page.url.pathname === resolve('/(public)/request'));
</script>

<svelte:head>
	<meta name="description" content={es.public.metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="es_VE" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content="{es.home.title} · {siteName}" />
	<meta property="og:description" content={es.public.metaDescription} />
	{#if data.logoUrl}<meta property="og:image" content={data.logoUrl} />{/if}
</svelte:head>

<a
	href="#contenido"
	class="sr-only z-50 rounded-md bg-white px-4 py-2 font-medium text-blue-800 shadow focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
>
	{es.public.skipToContent}
</a>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-slate-200 bg-white">
		<nav class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
			<a
				href={resolve('/(public)')}
				class="flex min-w-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
			>
				{#if data.council?.logoPath}
					<img src={data.council.logoPath} alt="" class="h-9 w-auto max-w-28 object-contain" />
				{/if}
				<span class="truncate font-semibold">{siteName}</span>
			</a>
			{#if !onRequest}
				<a
					href={resolve('/(public)/request')}
					class="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
				>
					{es.nav.request}
				</a>
			{/if}
		</nav>
	</header>

	<main id="contenido" tabindex="-1" class="mx-auto w-full max-w-3xl flex-1 px-4 py-8 outline-none">
		{@render children()}
	</main>

	<footer class="border-t border-slate-200 bg-white">
		<div class="mx-auto max-w-3xl space-y-1 px-4 py-6 text-sm text-slate-600">
			{#if data.council}
				<p class="font-medium text-slate-800">{data.council.name}</p>
				{#if data.council.taxId}<p>{es.public.taxId} {data.council.taxId}</p>{/if}
				<p>{data.council.place}</p>
			{/if}
		</div>
	</footer>
</div>
