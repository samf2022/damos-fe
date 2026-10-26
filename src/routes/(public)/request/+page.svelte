<script lang="ts">
	// Step-by-step request form: one short topic per screen, big tap targets, a review screen
	// before sending. Every input stays in the one <form> (other steps are just hidden), so the
	// server action receives the same fields as before. Steps live in shallow routing state, so
	// the phone's back button goes to the previous step instead of leaving the page.
	import { enhance } from '$app/forms';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import Turnstile from '#lib/components/Turnstile.svelte';
	import { normalizeKnownSince } from '#lib/certificates/renderCertificateBody.ts';
	import { es } from '#lib/i18n/es.ts';
	import {
		isMaritalStatus,
		MARITAL_STATUSES,
		maritalStatusWord,
		type MaritalStatus
	} from '#lib/text/genderAgreement.ts';
	import {
		normalizeNationalId,
		REQUEST_FIELDS,
		validateCertificateRequest,
		type RequestErrors,
		type RequestField,
		type RequestValues
	} from '#lib/validation/certificateRequest.ts';
	import { formatVenezuelanPhone } from '#lib/whatsapp.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.request;
	const w = t.wizard;

	const STEPS = [
		{ id: 'type', fields: ['certificate_type_id'] },
		{ id: 'identity', fields: ['national_id', 'first_names', 'last_names'] },
		{ id: 'about', fields: ['gender', 'marital_status', 'occupation'] },
		{ id: 'home', fields: ['street_address', 'house_number', 'known_since_text'] },
		{ id: 'contact', fields: ['phone'] },
		{ id: 'review', fields: [] }
	] as const satisfies readonly { id: keyof typeof w.steps; fields: readonly RequestField[] }[];
	const REVIEW = STEPS.length - 1;

	const step = $derived(Math.min(page.state.step ?? 0, REVIEW));
	const fromReview = $derived(page.state.fromReview === true && step !== REVIEW);
	const current = $derived(STEPS[step]);

	function initialValues(): RequestValues {
		const values = Object.fromEntries(REQUEST_FIELDS.map((field) => [field, ''])) as RequestValues;
		values.certificate_type_id = data.preselectedTypeId ?? '';
		return { ...values, ...form?.values };
	}
	let values = $state(initialValues());
	let errors = $state<RequestErrors>({});

	let submitting = $state(false);
	/** Bumped after each submit: Turnstile tokens are single-use. */
	let attempts = $state(0);
	let headingElement = $state<HTMLElement>();
	let alertElement = $state<HTMLElement | null>(null);

	/** Problems not tied to a field (duplicate request, CAPTCHA, rate limit). */
	const generalMessage = $derived(
		form?.message && Object.keys(form?.errors ?? {}).length === 0 ? form.message : null
	);
	const stepHasErrors = $derived(
		(current.fields as readonly RequestField[]).some((field) => errors[field])
	);

	function toFormData(): FormData {
		const formData = new FormData();
		for (const field of REQUEST_FIELDS) formData.set(field, values[field]);
		return formData;
	}

	/** Same rules as the server, applied only to `fields`. Returns the fields with a problem. */
	function check(fields: readonly RequestField[]): RequestField[] {
		const result = validateCertificateRequest(toFormData());
		const found: RequestErrors = result.ok ? {} : result.errors;
		errors = { ...errors, ...Object.fromEntries(fields.map((field) => [field, found[field]])) };
		return fields.filter((field) => found[field]);
	}

	function go(target: number, options: { fromReview?: boolean } = {}) {
		pushState('', { step: target, fromReview: options.fromReview });
	}

	async function next() {
		const invalid = check(current.fields);
		if (invalid.length > 0) {
			await tick();
			document.getElementById(invalid[0])?.focus();
			return;
		}
		go(fromReview ? REVIEW : step + 1);
	}

	function back() {
		if (step > 0) history.back();
	}

	// Once a field shows an error, re-check it as the person fixes it.
	function onFix(event: Event) {
		const name = (event.target as HTMLInputElement | null)?.name ?? '';
		const field = REQUEST_FIELDS.find((candidate) => candidate === name);
		if (field && errors[field]) check([field]);
	}

	// Enter in a text box means "continue", not "send the whole form" from the middle of it.
	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void next();
		}
	}

	// Move focus to the new step's title so screen readers announce it and the page starts at
	// the top. Not on first load: the page should not jump before the person does anything.
	let shownStep: number | null = null;
	$effect(() => {
		const visible = step;
		if (shownStep !== null && visible !== shownStep) {
			void tick().then(() => {
				window.scrollTo({ top: 0 });
				headingElement?.focus();
			});
		}
		shownStep = visible;
	});

	const message = (field: RequestField) => {
		const code = errors[field];
		if (!code) return undefined;
		const required = (w.required as Partial<Record<RequestField, string>>)[field];
		return (code === 'required' || code === 'invalid_option') && required
			? required
			: es.formErrors[code];
	};
	const describedBy = (field: RequestField, hints: number) =>
		[
			...Array.from({ length: hints }, (_, index) => `${field}-hint-${index}`),
			errors[field] && `${field}-error`
		]
			.filter(Boolean)
			.join(' ') || undefined;
	const inputClass = (field: RequestField) =>
		`mt-2 block w-full rounded-lg border-2 px-3 py-3 text-lg ${
			errors[field]
				? 'border-red-600 focus:border-red-600 focus:ring-red-600'
				: 'border-slate-400 focus:border-blue-700 focus:ring-blue-700'
		}`;
	const choiceClass = (field: RequestField) =>
		`flex min-h-14 cursor-pointer gap-3 rounded-xl border-2 bg-white px-4 py-3 text-lg transition-colors has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-300 ${
			errors[field] ? 'border-red-600' : 'border-slate-300 hover:border-slate-500'
		}`;
	const radioClass = 'size-6 shrink-0 text-blue-700 focus:ring-0 focus:ring-offset-0';

	const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
	const gender = $derived(values.gender === 'F' || values.gender === 'M' ? values.gender : null);
	/** "Soltera" for a woman, "Soltero" for a man; "Soltero(a)" until the person answers. */
	const maritalLabel = (status: MaritalStatus) =>
		gender ? capitalize(maritalStatusWord(status, gender)) : es.maritalStatus[status];

	const notGiven = (text: string) => text.trim() || w.notGiven;
	const review = $derived<{ label: string; value: string; step: number }[]>([
		{
			label: t.certificateType,
			value:
				data.certificateTypes.find((type) => type.id === values.certificate_type_id)?.title ?? '',
			step: 0
		},
		{
			label: w.fields.nationalId,
			value: normalizeNationalId(values.national_id) ?? values.national_id,
			step: 1
		},
		{ label: w.fields.firstNames, value: values.first_names, step: 1 },
		{ label: w.fields.lastNames, value: values.last_names, step: 1 },
		{ label: t.resident.gender, value: gender ? w.fields.genderOptions[gender] : '', step: 2 },
		{
			label: t.resident.maritalStatus,
			value: isMaritalStatus(values.marital_status) ? maritalLabel(values.marital_status) : '',
			step: 2
		},
		{ label: t.resident.occupation, value: notGiven(values.occupation), step: 2 },
		{ label: w.fields.streetAddress, value: values.street_address, step: 3 },
		{ label: w.fields.houseNumber, value: notGiven(values.house_number), step: 3 },
		{ label: t.knownSince, value: normalizeKnownSince(values.known_since_text), step: 3 },
		{ label: w.fields.phone, value: formatVenezuelanPhone(values.phone) ?? values.phone, step: 4 }
	]);
</script>

<svelte:head>
	<title>{w.steps[current.id].title} · {t.title} · {data.council?.name ?? es.app.name}</title>
</svelte:head>

{#snippet hintsAndError(field: RequestField, hints: string[] = [])}
	{#each hints as hint, index (index)}
		<p id="{field}-hint-{index}" class="mt-1 text-base text-slate-600">{hint}</p>
	{/each}
	{#if message(field)}
		<p id="{field}-error" class="mt-2 flex gap-2 text-base font-semibold text-red-700">
			<span aria-hidden="true">⚠</span>{message(field)}
		</p>
	{/if}
{/snippet}

{#snippet textField(
	field: RequestField,
	label: string,
	options: {
		hints?: string[];
		optional?: boolean;
		type?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		inputmode?: 'text' | 'tel' | 'numeric';
		maxlength?: number;
		autocapitalize?: 'words' | 'sentences' | 'off';
	} = {}
)}
	<div>
		<label for={field} class="block text-lg font-semibold">
			{label}
			{#if options.optional}<span class="font-normal text-slate-600">{t.optional}</span>{/if}
		</label>
		{@render hintsAndError(field, options.hints)}
		<input
			id={field}
			name={field}
			type={options.type ?? 'text'}
			bind:value={values[field]}
			required={!options.optional}
			maxlength={options.maxlength}
			autocomplete={options.autocomplete}
			inputmode={options.inputmode}
			autocapitalize={options.autocapitalize}
			spellcheck="false"
			onkeydown={onKeydown}
			aria-invalid={errors[field] ? 'true' : undefined}
			aria-describedby={describedBy(field, options.hints?.length ?? 0)}
			class={inputClass(field)}
		/>
	</div>
{/snippet}

<p class="text-base font-medium text-slate-600">{t.title}</p>

{#if data.certificateTypes.length === 0}
	<p class="mt-6 rounded-lg bg-amber-50 p-4 text-lg text-amber-900">{t.noTypes}</p>
{:else}
	<div class="mt-3">
		<p class="text-base font-semibold text-blue-800">
			{w.stepOf.replace('{n}', String(step + 1)).replace('{total}', String(STEPS.length))}
		</p>
		<div class="mt-2 flex gap-1.5" aria-hidden="true">
			{#each STEPS as item, index (item.id)}
				<span class="h-2 flex-1 rounded-full {index <= step ? 'bg-blue-700' : 'bg-slate-200'}"
				></span>
			{/each}
		</div>
	</div>

	<h1
		bind:this={headingElement}
		id="step-title"
		tabindex="-1"
		class="mt-6 text-3xl font-bold tracking-tight outline-none"
	>
		{w.steps[current.id].title}
	</h1>
	<p class="mt-2 text-lg text-slate-700">{w.steps[current.id].intro}</p>

	{#if stepHasErrors}
		<p
			class="mt-4 rounded-lg border-2 border-red-600 bg-red-50 p-3 text-base font-semibold text-red-800"
		>
			{w.stepErrors}
		</p>
	{/if}

	<form
		method="POST"
		novalidate
		class="mt-6"
		oninput={onFix}
		onchange={onFix}
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				await update({ reset: false });
				submitting = false;
				attempts += 1;
				if (result.type !== 'failure') return;
				const found = (result.data?.errors ?? {}) as RequestErrors;
				errors = { ...found };
				const first = STEPS.findIndex((item) =>
					(item.fields as readonly RequestField[]).some((field) => found[field])
				);
				if (first >= 0) go(first, { fromReview: true });
				else {
					await tick();
					alertElement?.focus();
				}
			};
		}}
	>
		<div hidden={step !== 0}>
			<div
				role="radiogroup"
				aria-labelledby="step-title"
				aria-describedby={describedBy('certificate_type_id', 0)}
				class="grid gap-3"
			>
				{#each data.certificateTypes as type, index (type.id)}
					<label class="{choiceClass('certificate_type_id')} items-start py-4">
						<input
							id={index === 0 ? 'certificate_type_id' : undefined}
							type="radio"
							name="certificate_type_id"
							value={type.id}
							bind:group={values.certificate_type_id}
							class="mt-0.5 {radioClass}"
						/>
						<span>
							<span class="block font-semibold">{type.title}</span>
							<span class="mt-1 block text-base text-slate-700">
								{es.certificateTypeDescriptions[type.code]}
							</span>
						</span>
					</label>
				{/each}
			</div>
			{@render hintsAndError('certificate_type_id')}
		</div>

		<div hidden={step !== 1} class="space-y-6">
			{@render textField('national_id', w.fields.nationalId, {
				hints: [w.fields.nationalIdHint, w.fields.nationalIdForeign],
				maxlength: 20,
				autocomplete: 'off',
				autocapitalize: 'off'
			})}
			{@render textField('first_names', w.fields.firstNames, {
				hints: [w.fields.firstNamesHint],
				autocomplete: 'given-name',
				autocapitalize: 'words',
				maxlength: 80
			})}
			{@render textField('last_names', w.fields.lastNames, {
				hints: [w.fields.lastNamesHint],
				autocomplete: 'family-name',
				autocapitalize: 'words',
				maxlength: 80
			})}
		</div>

		<div hidden={step !== 2} class="space-y-8">
			<fieldset aria-describedby={describedBy('gender', 0)}>
				<legend class="text-lg font-semibold">{w.fields.gender}</legend>
				{@render hintsAndError('gender')}
				<div class="mt-2 grid grid-cols-2 gap-3">
					{#each ['F', 'M'] as const as option, index (option)}
						<label class="{choiceClass('gender')} items-center">
							<input
								id={index === 0 ? 'gender' : undefined}
								type="radio"
								name="gender"
								value={option}
								bind:group={values.gender}
								class={radioClass}
							/>
							{w.fields.genderOptions[option]}
						</label>
					{/each}
				</div>
			</fieldset>

			<fieldset aria-describedby={describedBy('marital_status', 0)}>
				<legend class="text-lg font-semibold">{w.fields.maritalStatus}</legend>
				{@render hintsAndError('marital_status')}
				<div class="mt-2 grid gap-3 sm:grid-cols-2">
					{#each MARITAL_STATUSES as status, index (status)}
						<label class="{choiceClass('marital_status')} items-center">
							<input
								id={index === 0 ? 'marital_status' : undefined}
								type="radio"
								name="marital_status"
								value={status}
								bind:group={values.marital_status}
								class={radioClass}
							/>
							{maritalLabel(status)}
						</label>
					{/each}
				</div>
			</fieldset>

			{@render textField('occupation', w.fields.occupation, {
				hints: [w.fields.occupationHint],
				optional: true,
				maxlength: 80
			})}
		</div>

		<div hidden={step !== 3} class="space-y-6">
			{@render textField('street_address', w.fields.streetAddress, {
				hints: [w.fields.streetAddressHint],
				autocomplete: 'address-line1',
				maxlength: 160
			})}
			{@render textField('house_number', w.fields.houseNumber, {
				hints: [w.fields.houseNumberHint],
				optional: true,
				autocomplete: 'address-line2',
				maxlength: 40
			})}
			{@render textField('known_since_text', w.fields.knownSince, {
				hints: [w.fields.knownSinceHint],
				maxlength: 60
			})}
		</div>

		<div hidden={step !== 4}>
			{@render textField('phone', w.fields.phone, {
				hints: [w.fields.phoneHint],
				type: 'tel',
				autocomplete: 'tel-national',
				inputmode: 'tel',
				maxlength: 20
			})}
		</div>

		<!-- Honeypot: hidden from people and assistive tech; bots tend to fill it. -->
		<div class="hidden" aria-hidden="true">
			<label>
				Website
				<input name="website" tabindex="-1" autocomplete="off" />
			</label>
		</div>

		{#if step === REVIEW}
			{#if generalMessage}
				<p
					bind:this={alertElement}
					tabindex="-1"
					role="alert"
					class="mb-6 rounded-lg border-2 border-red-600 bg-red-50 p-4 text-lg text-red-800 outline-none"
				>
					{generalMessage}
				</p>
			{/if}

			<dl class="divide-y divide-slate-200 rounded-xl border-2 border-slate-200 bg-white">
				{#each review as row (row.label)}
					<div class="flex items-start justify-between gap-4 px-4 py-3">
						<div class="min-w-0">
							<dt class="text-base text-slate-600">{row.label}</dt>
							<dd class="text-lg font-semibold break-words">{row.value}</dd>
						</div>
						<button
							type="button"
							onclick={() => go(row.step, { fromReview: true })}
							aria-label={w.changeLabel.replace('{field}', row.label.toLowerCase())}
							class="shrink-0 rounded-md px-2 py-2 text-base font-semibold text-blue-700 underline hover:no-underline focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none"
						>
							{w.change}
						</button>
					</div>
				{/each}
			</dl>

			<div class="mt-6 space-y-4">
				{#if data.turnstileSiteKey}
					<Turnstile
						siteKey={data.turnstileSiteKey}
						label={t.captchaLabel}
						unavailableMessage={t.captchaUnavailable}
						resetKey={attempts}
					/>
				{/if}
				<p class="text-base text-slate-600">{es.public.privacy}</p>
			</div>
		{/if}

		<div class="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
			{#if step === REVIEW}
				<button
					disabled={submitting}
					aria-busy={submitting}
					class="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-8 text-xl font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:ring-4 focus-visible:ring-green-300 focus-visible:outline-none disabled:opacity-60 sm:w-auto"
				>
					{#if submitting}
						<svg class="size-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
			{:else}
				<button
					type="button"
					onclick={next}
					class="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-8 text-xl font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none sm:w-auto"
				>
					{fromReview ? w.backToReview : w.next}
					{#if !fromReview}<span aria-hidden="true">→</span>{/if}
				</button>
			{/if}
			{#if step > 0}
				<button
					type="button"
					onclick={back}
					class="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 text-lg font-semibold text-slate-800 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none sm:w-auto"
				>
					<span aria-hidden="true">←</span>
					{w.back}
				</button>
			{/if}
		</div>
	</form>

	<p class="mt-10 rounded-lg bg-slate-100 p-4 text-base text-slate-700">{w.help}</p>
{/if}
