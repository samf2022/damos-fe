<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { es } from '#lib/i18n/es.ts';
	import type { FormErrorCode } from '#lib/validation/form.ts';

	let {
		name,
		label,
		value = '',
		error,
		hint,
		placeholder,
		optional = false,
		rows,
		type = 'text',
		maxlength,
		min,
		max,
		autocomplete,
		inputmode
	}: {
		name: string;
		label: string;
		value?: string | number | null;
		error?: FormErrorCode;
		hint?: string;
		placeholder?: string;
		optional?: boolean;
		/** Renders a textarea with this many rows. */
		rows?: number;
		type?: HTMLInputAttributes['type'];
		maxlength?: number;
		min?: number;
		max?: number;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		inputmode?: HTMLInputAttributes['inputmode'];
	} = $props();

	const message = $derived(error ? es.formErrors[error] : undefined);
	const describedBy = $derived(
		[message && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(' ') || undefined
	);
	const inputClass = $derived(
		`mt-1 block w-full rounded-md ${message ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}`
	);
</script>

<label class="block">
	<span class="text-sm font-medium">
		{label}
		{#if optional}<span class="font-normal text-slate-500">{es.form.optional}</span>{/if}
	</span>
	{#if rows}
		<textarea
			{name}
			{rows}
			{maxlength}
			{placeholder}
			required={!optional}
			aria-invalid={message ? 'true' : undefined}
			aria-describedby={describedBy}
			class={inputClass}>{value ?? ''}</textarea
		>
	{:else}
		<input
			{name}
			{type}
			{maxlength}
			{min}
			{max}
			{placeholder}
			{autocomplete}
			{inputmode}
			value={value ?? ''}
			required={!optional}
			aria-invalid={message ? 'true' : undefined}
			aria-describedby={describedBy}
			class={inputClass}
		/>
	{/if}
	{#if hint}<span id="{name}-hint" class="mt-1 block text-xs text-slate-500">{hint}</span>{/if}
	{#if message}<span id="{name}-error" class="mt-1 block text-sm text-red-700">{message}</span>{/if}
</label>
