<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { es } from '#lib/i18n/es.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.admin.signers;

	const typeTitle = (id: string) => data.certificateTypes.find((type) => type.id === id)?.title;
</script>

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-bold">{t.title}</h1>
		<p class="mt-1 max-w-2xl text-slate-600">{t.description}</p>
	</div>
	<a
		href={resolve('/admin/signers/[id]', { id: 'new' })}
		class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
	>
		{t.add}
	</a>
</div>

{#if form?.message}
	<p class="mt-4 rounded-md bg-red-50 p-3 text-red-800" role="alert">{form.message}</p>
{/if}

{#if data.signers.length === 0}
	<p class="mt-6 text-slate-500">{t.empty}</p>
{:else}
	<ul class="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
		{#each data.signers as signer (signer.id)}
			<li class="flex flex-wrap items-center gap-4 p-4" class:opacity-60={!signer.is_active}>
				<span class="w-8 text-center text-sm text-slate-400">{signer.display_order}</span>
				<div class="min-w-48 flex-1">
					<p class="font-medium">
						{signer.full_name}
						{#if !signer.is_active}
							<span class="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-normal">
								{t.inactive}
							</span>
						{/if}
					</p>
					<p class="text-sm text-slate-500">
						{signer.role_title} · {signer.national_id}{signer.phone ? ` · ${signer.phone}` : ''}
					</p>
					<p class="mt-1 text-xs text-slate-500">
						{t.defaultFor}:
						{signer.certificate_type_ids.map(typeTitle).filter(Boolean).join(', ') || t.none}
					</p>
				</div>
				<div class="flex items-center gap-3 text-sm">
					<a
						href={resolve('/admin/signers/[id]', { id: signer.id })}
						class="text-blue-700 hover:underline"
					>
						{t.edit}
					</a>
					<form method="POST" action={signer.is_active ? '?/deactivate' : '?/activate'} use:enhance>
						<input type="hidden" name="id" value={signer.id} />
						<button
							class={signer.is_active
								? 'text-red-700 hover:underline'
								: 'text-green-700 hover:underline'}
						>
							{signer.is_active ? t.deactivate : t.activate}
						</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}
