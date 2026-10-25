<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '#lib/components/TextField.svelte';
	import { formatBytes, shrinkImage } from '#lib/images/shrinkImage.ts';
	import { es } from '#lib/i18n/es.ts';
	import { MAX_VALIDITY_MONTHS, type CouncilField } from '#lib/validation/councilSettings.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.admin.settings;

	const saveForm = $derived(form?.action === 'save' ? form : null);
	const logoForm = $derived(form?.action === 'logo' ? form : null);

	// Values shown in the form: what was just submitted (on error) or what's stored.
	const stored = $derived<Record<CouncilField, string>>({
		name: data.settings?.name ?? '',
		tax_id: data.settings?.tax_id ?? '',
		state: data.settings?.state ?? '',
		municipality: data.settings?.municipality ?? '',
		parish: data.settings?.parish ?? '',
		sector_address: data.settings?.sector_address ?? '',
		city: data.settings?.city ?? '',
		validity_months: String(data.settings?.validity_months ?? 6),
		validity_note: data.settings?.validity_note ?? ''
	});
	const value = (field: CouncilField) => saveForm?.values?.[field] ?? stored[field];
	const error = (field: CouncilField) => saveForm?.errors?.[field];

	let saving = $state(false);
	let uploading = $state(false);
	let resizeNote = $state('');
	let hasFile = $state(false);

	async function onLogoChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const original = input.files?.[0];
		resizeNote = '';
		hasFile = Boolean(original);
		if (!original) return;
		const shrunk = await shrinkImage(original);
		if (shrunk !== original) {
			const transfer = new DataTransfer();
			transfer.items.add(shrunk);
			input.files = transfer.files;
			resizeNote = t.logo.resized
				.replace('{from}', formatBytes(original.size))
				.replace('{to}', formatBytes(shrunk.size));
		}
	}
</script>

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{t.title}</h1>
<p class="mt-1 text-slate-600">{t.description}</p>

<div class="mt-6 grid gap-8 xl:grid-cols-[1fr_24rem]">
	<!-- Re-render after each save so normalized values (e.g. the RIF) replace what was typed. -->
	{#key data.settings?.updated_at}
		<form
			method="POST"
			action="?/save"
			class="space-y-8"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
				};
			}}
		>
			{#if saveForm && 'message' in saveForm}
				<p class="rounded-md bg-green-50 p-3 text-green-900" role="status">{saveForm.message}</p>
			{/if}

			<fieldset class="grid gap-4 sm:grid-cols-2">
				<legend class="mb-3 text-lg font-semibold">{t.sections.council}</legend>
				<div class="sm:col-span-2">
					<TextField
						name="name"
						label={t.fields.name}
						value={value('name')}
						error={error('name')}
						maxlength={120}
					/>
				</div>
				<TextField
					name="tax_id"
					label={t.fields.taxId}
					value={value('tax_id')}
					error={error('tax_id')}
					placeholder={t.fields.taxIdHint}
					optional
					maxlength={20}
				/>
			</fieldset>

			<fieldset class="grid gap-4 sm:grid-cols-2">
				<legend class="mb-1 text-lg font-semibold">{t.sections.location}</legend>
				<p class="text-sm text-slate-500 sm:col-span-2">{t.fields.placeNameHint}</p>
				<TextField
					name="state"
					label={t.fields.state}
					value={value('state')}
					error={error('state')}
					maxlength={80}
				/>
				<TextField
					name="municipality"
					label={t.fields.municipality}
					value={value('municipality')}
					error={error('municipality')}
					maxlength={80}
				/>
				<TextField
					name="parish"
					label={t.fields.parish}
					value={value('parish')}
					error={error('parish')}
					maxlength={80}
				/>
				<TextField
					name="city"
					label={t.fields.city}
					value={value('city')}
					error={error('city')}
					hint={t.fields.cityHint}
					maxlength={80}
				/>
				<div class="sm:col-span-2">
					<TextField
						name="sector_address"
						label={t.fields.sectorAddress}
						value={value('sector_address')}
						hint={t.fields.sectorAddressHint}
						error={error('sector_address')}
						maxlength={160}
					/>
				</div>
			</fieldset>

			<fieldset class="grid gap-4 sm:grid-cols-[10rem_1fr]">
				<legend class="mb-3 text-lg font-semibold">{t.sections.validity}</legend>
				<TextField
					name="validity_months"
					label={t.fields.validityMonths}
					type="number"
					min={1}
					max={MAX_VALIDITY_MONTHS}
					value={value('validity_months')}
					error={error('validity_months')}
				/>
				<TextField
					name="validity_note"
					label={t.fields.validityNote}
					value={value('validity_note')}
					error={error('validity_note')}
					hint={t.fields.validityNoteHint}
					optional
					rows={2}
					maxlength={300}
				/>
			</fieldset>

			<button
				disabled={saving}
				class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
			>
				{t.save}
			</button>
		</form>
	{/key}

	<section class="h-fit space-y-4 rounded-lg border border-slate-200 bg-white p-4">
		<h2 class="text-lg font-semibold">{t.logo.title}</h2>
		<p class="text-sm text-slate-600">{t.logo.description}</p>

		{#if logoForm && 'message' in logoForm}
			<p class="rounded-md bg-green-50 p-3 text-sm text-green-900" role="status">
				{logoForm.message}
			</p>
		{:else if logoForm && 'error' in logoForm}
			<p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{logoForm.error}</p>
		{/if}

		{#if data.settings?.logo_r2_key}
			<figure>
				<figcaption class="text-sm text-slate-500">{t.logo.current}</figcaption>
				<img
					src="/api/files/{data.settings.logo_r2_key}"
					alt={t.logo.current}
					class="mt-2 w-full rounded border border-slate-200"
				/>
			</figure>
			<form method="POST" action="?/removeLogo" use:enhance>
				<button class="text-sm text-red-700 hover:underline">{t.logo.remove}</button>
			</form>
		{:else}
			<p class="text-sm text-slate-500">{t.logo.none}</p>
		{/if}

		<form
			method="POST"
			action="?/uploadLogo"
			enctype="multipart/form-data"
			class="space-y-3"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					await update();
					uploading = false;
					hasFile = false;
					resizeNote = '';
				};
			}}
		>
			<label class="block">
				<span class="text-sm font-medium">{t.logo.choose}</span>
				<input
					type="file"
					name="logo"
					accept="image/jpeg,image/png"
					required
					onchange={onLogoChange}
					class="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 hover:file:bg-slate-200"
				/>
			</label>
			{#if resizeNote}<p class="text-xs text-slate-500">{resizeNote}</p>{/if}
			<button
				disabled={uploading || !hasFile}
				class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
			>
				{uploading ? t.logo.uploading : t.logo.upload}
			</button>
		</form>
	</section>
</div>
