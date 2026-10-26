<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import Turnstile from '#lib/components/Turnstile.svelte';
	import { es } from '#lib/i18n/es.ts';
	import { MARITAL_STATUSES } from '#lib/text/genderAgreement.ts';
	import {
		REQUEST_FIELDS,
		validateCertificateRequest,
		type RequestErrors,
		type RequestField
	} from '#lib/validation/certificateRequest.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.request;

	/** In the order the fields appear, which is also the order of the error summary. */
	const LABELS: Record<RequestField, string> = {
		certificate_type_id: t.certificateType,
		national_id: t.resident.nationalId,
		gender: t.resident.gender,
		first_names: t.resident.firstNames,
		last_names: t.resident.lastNames,
		marital_status: t.resident.maritalStatus,
		occupation: t.resident.occupation,
		street_address: t.resident.streetAddress,
		house_number: t.resident.houseNumber,
		phone: t.resident.phone,
		known_since_text: t.knownSince
	};

	let submitting = $state(false);
	/** Bumped after each submit: Turnstile tokens are single-use. */
	let attempts = $state(0);
	let formElement = $state<HTMLFormElement>();
	let summaryElement = $state<HTMLElement | null>(null);
	let alertElement = $state<HTMLElement | null>(null);

	// Errors on screen: the server's after a submit, then kept up to date while the person types.
	let errors = $derived<RequestErrors>({ ...(form?.errors ?? {}) });
	const FIELD_ORDER = Object.keys(LABELS) as RequestField[];
	const CHOICE_FIELDS: readonly RequestField[] = [
		'certificate_type_id',
		'gender',
		'marital_status'
	];
	const errorFields = $derived(FIELD_ORDER.filter((field) => errors[field]));
	/** "Completa «Nombres»." reads better in a list than repeating "Este campo es obligatorio". */
	const summaryText = (field: RequestField) =>
		errors[field] === 'required'
			? (CHOICE_FIELDS.includes(field) ? t.summaryChoose : t.summaryRequired).replace(
					'{field}',
					LABELS[field]
				)
			: `${LABELS[field]}: ${message(field)}`;
	/** Problems not tied to a field (duplicate request, CAPTCHA, rate limit). */
	const generalMessage = $derived(
		form?.message && Object.keys(form?.errors ?? {}).length === 0 ? form.message : null
	);

	const isRequestField = (name: string): name is RequestField =>
		(REQUEST_FIELDS as readonly string[]).includes(name);

	/**
	 * Same rules as the server. A field is checked when the person leaves it with something
	 * typed (empty fields are only flagged on submit, so tabbing through doesn't nag), and
	 * re-checked as they fix it.
	 */
	function recheck(field: RequestField, mode: 'leave' | 'fix') {
		if (!formElement) return;
		const input = new FormData(formElement);
		if (mode === 'leave' && !String(input.get(field) ?? '').trim()) return;
		if (mode === 'fix' && !errors[field]) return;
		const result = validateCertificateRequest(input);
		errors = { ...errors, [field]: result.ok ? undefined : result.errors[field] };
	}

	const onEvent = (mode: 'leave' | 'fix') => (event: Event) => {
		const name = (event.target as HTMLInputElement | null)?.name ?? '';
		if (isRequestField(name)) recheck(name, mode);
	};

	function focusField(event: MouseEvent, field: RequestField) {
		event.preventDefault();
		const element = document.getElementById(field);
		element?.focus();
		element?.closest('fieldset, label, div')?.scrollIntoView({ block: 'center' });
	}

	const value = (field: RequestField) => form?.values?.[field] ?? '';
	const selectedType = (id: string) =>
		value('certificate_type_id')
			? value('certificate_type_id') === id
			: data.preselectedTypeId === id;
	const message = (field: RequestField) => {
		const code = errors[field];
		return code ? es.formErrors[code] : undefined;
	};
	const describedBy = (field: RequestField, hint: boolean) =>
		[hint && `${field}-hint`, errors[field] && `${field}-error`].filter(Boolean).join(' ') ||
		undefined;
	const inputClass = (field: RequestField) =>
		`mt-1 block w-full rounded-lg py-2.5 text-base ${
			errors[field]
				? 'border-red-600 focus:border-red-600 focus:ring-red-600'
				: 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
		}`;
</script>

<svelte:head>
	<title>{t.title} · {data.council?.name ?? es.app.name}</title>
</svelte:head>

{#snippet labelText(field: RequestField, optional = false)}
	<span class="block font-medium">
		{LABELS[field]}
		{#if optional}<span class="font-normal text-slate-500">{t.optional}</span>{/if}
	</span>
{/snippet}

{#snippet hintAndError(field: RequestField, hint?: string)}
	{#if hint}<p id="{field}-hint" class="mt-1 text-sm text-slate-500">{hint}</p>{/if}
	{#if message(field)}
		<p id="{field}-error" class="mt-1 flex gap-1 text-sm font-medium text-red-700">
			<span aria-hidden="true">⚠</span>{message(field)}
		</p>
	{/if}
{/snippet}

{#snippet textField(
	field: RequestField,
	options: {
		hint?: string;
		optional?: boolean;
		type?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		inputmode?: 'text' | 'tel' | 'numeric';
		maxlength?: number;
		autocapitalize?: 'words' | 'sentences' | 'off';
	} = {}
)}
	<div>
		<label for={field}>{@render labelText(field, options.optional)}</label>
		<input
			id={field}
			name={field}
			type={options.type ?? 'text'}
			value={value(field)}
			required={!options.optional}
			maxlength={options.maxlength}
			autocomplete={options.autocomplete}
			inputmode={options.inputmode}
			autocapitalize={options.autocapitalize}
			aria-invalid={errors[field] ? 'true' : undefined}
			aria-describedby={describedBy(field, !!options.hint)}
			class={inputClass(field)}
		/>
		{@render hintAndError(field, options.hint)}
	</div>
{/snippet}

<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>
<p class="mt-2 text-lg text-slate-600">{t.description}</p>
<p class="mt-1 text-sm text-slate-500">{t.meta}</p>

{#if data.certificateTypes.length === 0}
	<p class="mt-6 rounded-lg bg-amber-50 p-4 text-amber-900">{t.noTypes}</p>
{:else}
	{#if errorFields.length > 0 && form?.errors}
		<div
			bind:this={summaryElement}
			tabindex="-1"
			role="alert"
			aria-labelledby="error-summary-title"
			class="mt-6 rounded-lg border-2 border-red-600 bg-red-50 p-4 outline-none focus-visible:ring-4 focus-visible:ring-red-300"
		>
			<h2 id="error-summary-title" class="font-semibold text-red-800">{t.errorSummary}</h2>
			<ul class="mt-2 list-inside list-disc space-y-1">
				{#each errorFields as field (field)}
					<li>
						<a
							href="#{field}"
							onclick={(event) => focusField(event, field)}
							class="text-red-800 underline hover:no-underline"
						>
							{summaryText(field)}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	{#if generalMessage}
		<p
			bind:this={alertElement}
			tabindex="-1"
			role="alert"
			class="mt-6 rounded-lg border-2 border-red-600 bg-red-50 p-4 text-red-800 outline-none"
		>
			{generalMessage}
		</p>
	{/if}

	<form
		bind:this={formElement}
		method="POST"
		novalidate
		class="mt-8 space-y-10"
		onfocusout={onEvent('leave')}
		oninput={onEvent('fix')}
		onchange={onEvent('fix')}
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				await update({ reset: false });
				submitting = false;
				attempts += 1;
				if (result.type === 'failure') {
					await tick();
					(summaryElement ?? alertElement)?.focus();
				}
			};
		}}
	>
		<fieldset aria-describedby={describedBy('certificate_type_id', false)}>
			<legend class="text-xl font-semibold">
				<span class="text-blue-700">1.</span>
				{t.sections.type}
			</legend>
			<div class="mt-4 grid gap-3">
				{#each data.certificateTypes as type, index (type.id)}
					<label
						class="flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-white p-4 transition-colors has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-300 {errors.certificate_type_id
							? 'border-red-600'
							: 'border-slate-200 hover:border-slate-400'}"
					>
						<input
							id={index === 0 ? 'certificate_type_id' : undefined}
							type="radio"
							name="certificate_type_id"
							value={type.id}
							checked={selectedType(type.id)}
							required
							class="mt-1 size-5 text-blue-700 focus:ring-0 focus:ring-offset-0"
						/>
						<span>
							<span class="block font-semibold">{type.title}</span>
							<span class="mt-0.5 block text-sm text-slate-600">
								{es.certificateTypeDescriptions[type.code]}
							</span>
						</span>
					</label>
				{/each}
			</div>
			{@render hintAndError('certificate_type_id')}
		</fieldset>

		<fieldset class="grid gap-5 sm:grid-cols-2">
			<legend class="mb-4 text-xl font-semibold">
				<span class="text-blue-700">2.</span>
				{t.sections.personal}
			</legend>
			{@render textField('national_id', {
				hint: t.nationalIdFormat,
				maxlength: 20,
				autocomplete: 'off',
				autocapitalize: 'off'
			})}
			<div>
				<label for="gender">{@render labelText('gender')}</label>
				<select
					id="gender"
					name="gender"
					required
					aria-invalid={errors.gender ? 'true' : undefined}
					aria-describedby={describedBy('gender', false)}
					class={inputClass('gender')}
				>
					<option value="" selected={!value('gender')} disabled>{t.choose}</option>
					<option value="F" selected={value('gender') === 'F'}>{es.gender.F}</option>
					<option value="M" selected={value('gender') === 'M'}>{es.gender.M}</option>
				</select>
				{@render hintAndError('gender')}
			</div>
			{@render textField('first_names', {
				autocomplete: 'given-name',
				autocapitalize: 'words',
				maxlength: 80
			})}
			{@render textField('last_names', {
				autocomplete: 'family-name',
				autocapitalize: 'words',
				maxlength: 80
			})}
			<div>
				<label for="marital_status">{@render labelText('marital_status')}</label>
				<select
					id="marital_status"
					name="marital_status"
					required
					aria-invalid={errors.marital_status ? 'true' : undefined}
					aria-describedby={describedBy('marital_status', false)}
					class={inputClass('marital_status')}
				>
					<option value="" selected={!value('marital_status')} disabled>{t.choose}</option>
					{#each MARITAL_STATUSES as status (status)}
						<option value={status} selected={value('marital_status') === status}>
							{es.maritalStatus[status]}
						</option>
					{/each}
				</select>
				{@render hintAndError('marital_status')}
			</div>
			{@render textField('occupation', { optional: true, maxlength: 80 })}
		</fieldset>

		<fieldset class="grid gap-5 sm:grid-cols-2">
			<legend class="mb-4 text-xl font-semibold">
				<span class="text-blue-700">3.</span>
				{t.sections.address}
			</legend>
			{@render textField('street_address', {
				autocomplete: 'address-line1',
				maxlength: 160
			})}
			{@render textField('house_number', {
				hint: t.houseNumberFormat,
				optional: true,
				autocomplete: 'address-line2',
				maxlength: 40
			})}
			{@render textField('phone', {
				hint: t.phoneFormat,
				type: 'tel',
				autocomplete: 'tel-national',
				inputmode: 'tel',
				maxlength: 20
			})}
			{@render textField('known_since_text', { hint: t.knownSinceFormat, maxlength: 60 })}
		</fieldset>

		<!-- Honeypot: hidden from people and assistive tech; bots tend to fill it. -->
		<div class="hidden" aria-hidden="true">
			<label>
				Website
				<input name="website" tabindex="-1" autocomplete="off" />
			</label>
		</div>

		<div class="space-y-4 border-t border-slate-200 pt-6">
			{#if data.turnstileSiteKey}
				<Turnstile
					siteKey={data.turnstileSiteKey}
					label={t.captchaLabel}
					unavailableMessage={t.captchaUnavailable}
					resetKey={attempts}
				/>
			{/if}
			<p class="text-sm text-slate-500">{es.public.privacy}</p>
			<button
				disabled={submitting}
				aria-busy={submitting}
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none disabled:opacity-60 sm:w-auto"
			>
				{#if submitting}
					<svg class="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-opacity=".3"
							stroke-width="4"
						></circle>
						<path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="4"></path>
					</svg>
				{/if}
				{submitting ? t.submitting : t.submit}
			</button>
		</div>
	</form>
{/if}
