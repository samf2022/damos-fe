<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import TextField from '#lib/components/TextField.svelte';
	import { es } from '#lib/i18n/es.ts';
	import type { SignerField } from '#lib/validation/signer.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.admin.signers;
	const f = t.fields;

	const stored = $derived<Record<SignerField, string>>({
		full_name: data.signer?.full_name ?? '',
		short_name: data.signer?.short_name ?? '',
		national_id: data.signer?.national_id ?? '',
		role_title: data.signer?.role_title ?? '',
		phone: data.signer?.phone ?? '',
		gender: data.signer?.gender ?? '',
		display_order: String(data.signer?.display_order ?? '')
	});
	const value = (field: SignerField) => form?.values?.[field] ?? stored[field];
	const error = (field: SignerField) => form?.errors?.[field];
	const selectedTypes = $derived(
		form?.values?.certificate_type_ids ?? data.signer?.certificate_type_ids ?? []
	);

	let saving = $state(false);
	const title = $derived(data.signer ? t.editTitle : t.newTitle);
</script>

<svelte:head>
	<title>{title} · {es.app.name}</title>
</svelte:head>

<a href={resolve('/admin/signers')} class="text-sm text-blue-700 hover:underline">{t.back}</a>
<h1 class="mt-3 text-2xl font-bold">{title}</h1>

<form
	method="POST"
	class="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<div class="sm:col-span-2">
		<TextField
			name="full_name"
			label={f.fullName}
			hint={f.fullNameHint}
			value={value('full_name')}
			error={error('full_name')}
			maxlength={120}
		/>
	</div>
	<TextField
		name="short_name"
		label={f.shortName}
		placeholder={f.shortNameHint}
		value={value('short_name')}
		error={error('short_name')}
		maxlength={60}
	/>
	<TextField
		name="national_id"
		label={f.nationalId}
		placeholder={es.request.resident.nationalIdHint}
		value={value('national_id')}
		error={error('national_id')}
		maxlength={20}
	/>
	<TextField
		name="role_title"
		label={f.roleTitle}
		placeholder={f.roleTitleHint}
		value={value('role_title')}
		error={error('role_title')}
		maxlength={60}
	/>
	<TextField
		name="phone"
		label={f.phone}
		placeholder={es.request.resident.phoneHint}
		type="tel"
		inputmode="tel"
		optional
		value={value('phone')}
		error={error('phone')}
		maxlength={20}
	/>
	<label class="block">
		<span class="text-sm font-medium">{f.gender}</span>
		<select
			name="gender"
			required
			aria-invalid={error('gender') ? 'true' : undefined}
			aria-describedby="gender-hint"
			class="mt-1 block w-full rounded-md {error('gender') ? 'border-red-500' : 'border-slate-300'}"
		>
			<option value="" disabled selected={!value('gender')}>—</option>
			<option value="F" selected={value('gender') === 'F'}>{es.gender.F}</option>
			<option value="M" selected={value('gender') === 'M'}>{es.gender.M}</option>
		</select>
		<span id="gender-hint" class="mt-1 block text-xs text-slate-500">{f.genderHint}</span>
		{#if error('gender')}
			<span class="mt-1 block text-sm text-red-700">{es.formErrors[error('gender')!]}</span>
		{/if}
	</label>
	<TextField
		name="display_order"
		label={f.displayOrder}
		hint={f.displayOrderHint}
		type="number"
		min={0}
		optional
		value={value('display_order')}
		error={error('display_order')}
	/>

	<fieldset class="sm:col-span-2">
		<legend class="text-sm font-medium">{f.certificateTypes}</legend>
		<div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
			{#each data.certificateTypes as type (type.id)}
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						name="certificate_type_ids"
						value={type.id}
						checked={selectedTypes.includes(type.id)}
						class="rounded"
					/>
					{type.title}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="sm:col-span-2">
		<button
			disabled={saving}
			class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
		>
			{t.save}
		</button>
	</div>
</form>
