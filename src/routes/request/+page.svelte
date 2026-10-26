<script lang="ts">
	import { enhance } from '$app/forms';
	import PublicShell from '#lib/components/PublicShell.svelte';
	import Turnstile from '#lib/components/Turnstile.svelte';
	import { es } from '#lib/i18n/es.ts';
	import { MARITAL_STATUSES } from '#lib/text/genderAgreement.ts';
	import type { RequestField } from '#lib/validation/certificateRequest.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.request;

	let submitting = $state(false);
	/** Bumped after each submit: Turnstile tokens are single-use. */
	let attempts = $state(0);

	const value = (field: RequestField) => form?.values?.[field] ?? '';
	const errorOf = (field: RequestField) => {
		const code = form?.errors?.[field];
		return code ? es.formErrors[code] : undefined;
	};

	const inputClass = (field: RequestField) =>
		`mt-1 block w-full rounded-md ${errorOf(field) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}`;
</script>

<svelte:head>
	<title>{t.title} · {es.app.name}</title>
</svelte:head>

{#snippet fieldError(field: RequestField)}
	{#if errorOf(field)}
		<p id="{field}-error" class="mt-1 text-sm text-red-700">{errorOf(field)}</p>
	{/if}
{/snippet}

{#snippet textField(
	field: RequestField,
	label: string,
	options: {
		hint?: string;
		optional?: boolean;
		type?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		inputmode?: 'text' | 'tel' | 'numeric';
		maxlength?: number;
	} = {}
)}
	<label class="block">
		<span class="text-sm font-medium">
			{label}
			{#if options.optional}<span class="font-normal text-slate-500">{t.optional}</span>{/if}
		</span>
		<input
			name={field}
			type={options.type ?? 'text'}
			value={value(field)}
			required={!options.optional}
			maxlength={options.maxlength}
			autocomplete={options.autocomplete}
			inputmode={options.inputmode}
			placeholder={options.hint}
			aria-invalid={errorOf(field) ? 'true' : undefined}
			aria-describedby={errorOf(field) ? `${field}-error` : undefined}
			class={inputClass(field)}
		/>
		{@render fieldError(field)}
	</label>
{/snippet}

<PublicShell>
	<h1 class="text-2xl font-bold">{t.title}</h1>
	<p class="mt-2 text-slate-600">{t.description}</p>

	{#if data.certificateTypes.length === 0}
		<p class="mt-6 rounded-md bg-amber-50 p-3 text-amber-900">{t.noTypes}</p>
	{:else}
		<form
			method="POST"
			novalidate
			class="mt-6 space-y-8"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
					attempts += 1;
				};
			}}
		>
			{#if form?.message}
				<p class="rounded-md bg-red-50 p-3 text-red-800" role="alert">{form.message}</p>
			{/if}

			<fieldset>
				<legend class="text-lg font-semibold">{t.sections.type}</legend>
				<div class="mt-3 grid gap-3 sm:grid-cols-3">
					{#each data.certificateTypes as type (type.id)}
						<label
							class="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 has-[:checked]:border-blue-700 has-[:checked]:ring-1 has-[:checked]:ring-blue-700 {errorOf(
								'certificate_type_id'
							)
								? 'border-red-500'
								: 'border-slate-300'}"
						>
							<input
								type="radio"
								name="certificate_type_id"
								value={type.id}
								checked={value('certificate_type_id') === type.id}
								required
								aria-describedby={errorOf('certificate_type_id')
									? 'certificate_type_id-error'
									: undefined}
								class="mt-0.5"
							/>
							<span class="text-sm font-medium">{type.title}</span>
						</label>
					{/each}
				</div>
				{@render fieldError('certificate_type_id')}
			</fieldset>

			<fieldset class="grid gap-4 sm:grid-cols-2">
				<legend class="mb-3 text-lg font-semibold">{t.sections.personal}</legend>
				{@render textField('national_id', t.resident.nationalId, {
					hint: t.resident.nationalIdHint,
					maxlength: 20
				})}
				<label class="block">
					<span class="text-sm font-medium">{t.resident.gender}</span>
					<select
						name="gender"
						required
						aria-invalid={errorOf('gender') ? 'true' : undefined}
						aria-describedby={errorOf('gender') ? 'gender-error' : undefined}
						class={inputClass('gender')}
					>
						<option value="" selected={!value('gender')} disabled>—</option>
						<option value="F" selected={value('gender') === 'F'}>{es.gender.F}</option>
						<option value="M" selected={value('gender') === 'M'}>{es.gender.M}</option>
					</select>
					{@render fieldError('gender')}
				</label>
				{@render textField('first_names', t.resident.firstNames, {
					autocomplete: 'given-name',
					maxlength: 80
				})}
				{@render textField('last_names', t.resident.lastNames, {
					autocomplete: 'family-name',
					maxlength: 80
				})}
				<label class="block">
					<span class="text-sm font-medium">{t.resident.maritalStatus}</span>
					<select
						name="marital_status"
						required
						aria-invalid={errorOf('marital_status') ? 'true' : undefined}
						aria-describedby={errorOf('marital_status') ? 'marital_status-error' : undefined}
						class={inputClass('marital_status')}
					>
						<option value="" selected={!value('marital_status')} disabled>—</option>
						{#each MARITAL_STATUSES as status (status)}
							<option value={status} selected={value('marital_status') === status}>
								{es.maritalStatus[status]}
							</option>
						{/each}
					</select>
					{@render fieldError('marital_status')}
				</label>
				{@render textField('occupation', t.resident.occupation, {
					optional: true,
					maxlength: 80
				})}
			</fieldset>

			<fieldset class="grid gap-4 sm:grid-cols-2">
				<legend class="mb-3 text-lg font-semibold">{t.sections.address}</legend>
				{@render textField('street_address', t.resident.streetAddress, {
					autocomplete: 'street-address',
					maxlength: 160
				})}
				{@render textField('house_number', t.resident.houseNumber, {
					optional: true,
					maxlength: 40
				})}
				{@render textField('phone', t.resident.phone, {
					hint: t.resident.phoneHint,
					type: 'tel',
					autocomplete: 'tel',
					inputmode: 'tel',
					maxlength: 20
				})}
				{@render textField('known_since_text', t.knownSince, {
					hint: t.knownSinceHint,
					maxlength: 60
				})}
			</fieldset>

			<!-- Honeypot: hidden from people and assistive tech; bots tend to fill it. -->
			<div class="hidden" aria-hidden="true">
				<label>
					Website
					<input name="website" tabindex="-1" autocomplete="off" />
				</label>
			</div>

			{#if data.turnstileSiteKey}
				<Turnstile
					siteKey={data.turnstileSiteKey}
					label={t.captchaLabel}
					unavailableMessage={t.captchaUnavailable}
					resetKey={attempts}
				/>
			{/if}

			<button
				disabled={submitting}
				class="w-full rounded-md bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
			>
				{submitting ? t.submitting : t.submit}
			</button>
		</form>
	{/if}
</PublicShell>
