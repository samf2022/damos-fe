<script lang="ts">
	import { enhance } from '$app/forms';
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const t = es.login;
</script>

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<main class="mx-auto mt-24 max-w-sm px-4">
	<h1 class="text-2xl font-bold">{t.title}</h1>
	<form method="POST" use:enhance class="mt-6 space-y-4">
		<label class="block">
			<span class="text-sm font-medium">{t.username}</span>
			<input
				name="username"
				autocomplete="username"
				required
				value={form?.username ?? ''}
				class="mt-1 block w-full rounded-md border-slate-300"
			/>
		</label>
		<label class="block">
			<span class="text-sm font-medium">{t.password}</span>
			<input
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="mt-1 block w-full rounded-md border-slate-300"
			/>
		</label>
		{#if form?.message}
			<p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{form.message}</p>
		{/if}
		<button
			class="w-full rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
		>
			{t.submit}
		</button>
	</form>
</main>
