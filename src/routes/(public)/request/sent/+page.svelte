<script lang="ts">
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.requestSent;
</script>

<svelte:head>
	<title>{t.title} · {data.council?.name ?? es.app.name}</title>
</svelte:head>

<section class="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
	<div class="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
		<svg class="size-9 text-green-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path
				fill-rule="evenodd"
				d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<h1 class="mt-4 text-3xl font-bold tracking-tight">{t.title}</h1>
	<p class="mt-2 text-lg text-slate-600">{t.description}</p>
</section>

<section class="mt-8" aria-labelledby="next-title">
	<h2 id="next-title" class="text-xl font-semibold">{t.nextTitle}</h2>
	<ol class="mt-4 space-y-3">
		{#each t.next as step, index (step)}
			<li class="flex gap-3">
				<span
					class="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800"
					aria-hidden="true">{index + 1}</span
				>
				<span class="pt-0.5 text-slate-700">{step}</span>
			</li>
		{/each}
	</ol>
</section>

<div class="mt-10 flex flex-col gap-3 sm:flex-row">
	<a
		href={resolve('/(public)')}
		class="rounded-lg bg-blue-700 px-6 py-3 text-center font-semibold text-white hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none"
	>
		{t.back}
	</a>
	<a
		href={resolve('/(public)/request')}
		class="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none"
	>
		{t.another}
	</a>
</div>
