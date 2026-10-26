<script lang="ts">
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = es.home;
	const requestUrl = (code?: string) =>
		code
			? `${resolve('/(public)/request')}?tipo=${encodeURIComponent(code)}`
			: resolve('/(public)/request');
</script>

<!-- requestUrl() builds on resolve(); the rule can't see through the helper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
	<title>{t.title} · {data.council?.name ?? es.app.name}</title>
</svelte:head>

<section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
	<h1 class="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
	<p class="mt-3 max-w-2xl text-lg text-slate-600">{t.description}</p>
	<div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
		<a
			href={requestUrl()}
			class="rounded-lg bg-blue-700 px-6 py-3 text-center text-lg font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none"
		>
			{t.cta}
		</a>
		<span class="text-center text-sm text-slate-500 sm:text-left">{t.ctaHint}</span>
	</div>
</section>

<section class="mt-10" aria-labelledby="steps-title">
	<h2 id="steps-title" class="text-xl font-semibold">{t.stepsTitle}</h2>
	<ol class="mt-4 grid gap-4 sm:grid-cols-3">
		{#each t.steps as step, index (step.title)}
			<li class="rounded-xl bg-white p-4 ring-1 ring-slate-200">
				<span
					class="flex size-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800"
					aria-hidden="true">{index + 1}</span
				>
				<h3 class="mt-3 font-semibold">{step.title}</h3>
				<p class="mt-1 text-sm text-slate-600">{step.text}</p>
			</li>
		{/each}
	</ol>
</section>

<div class="mt-10 grid gap-8 sm:grid-cols-2">
	<section aria-labelledby="needs-title">
		<h2 id="needs-title" class="text-xl font-semibold">{t.needTitle}</h2>
		<ul class="mt-4 space-y-2">
			{#each t.needs as need (need)}
				<li class="flex gap-2 text-slate-700">
					<svg
						class="mt-0.5 size-5 shrink-0 text-green-700"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
							clip-rule="evenodd"
						/>
					</svg>
					{need}
				</li>
			{/each}
		</ul>
	</section>

	{#if data.certificateTypes.length > 0}
		<section aria-labelledby="types-title">
			<h2 id="types-title" class="text-xl font-semibold">{t.typesTitle}</h2>
			<ul class="mt-4 space-y-3">
				{#each data.certificateTypes as type (type.code)}
					<li>
						<a
							href={requestUrl(type.code)}
							class="group block rounded-xl bg-white p-4 ring-1 ring-slate-200 hover:ring-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
						>
							<span class="font-semibold group-hover:text-blue-800">{type.title}</span>
							<span class="mt-1 block text-sm text-slate-600">
								{es.certificateTypeDescriptions[type.code]}
							</span>
							<span class="mt-2 inline-block text-sm font-medium text-blue-700">
								{t.requestThis} →
							</span>
						</a>
					</li>
				{/each}
			</ul>
			{#if data.council}
				<p class="mt-3 text-sm text-slate-500">
					{t.validity.replace('{months}', String(data.council.validityMonths))}
				</p>
			{/if}
		</section>
	{/if}
</div>
