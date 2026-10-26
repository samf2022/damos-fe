<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';
	import { DEFAULT_TEMPLATES } from '#lib/certificates/defaultTemplates.ts';
	import { MIN_SIGNERS, renderCertificateBody } from '#lib/certificates/renderCertificateBody.ts';
	import {
		SAMPLE_KNOWN_SINCE,
		SAMPLE_RESIDENTS,
		SAMPLE_SIGNERS
	} from '#lib/certificates/sampleData.ts';
	import {
		isTemplatePlaceholder,
		TEMPLATE_PLACEHOLDER_GROUPS,
		type TemplatePlaceholderGroup
	} from '#lib/certificates/templatePlaceholders.ts';
	import { es } from '#lib/i18n/es.ts';
	import { toUpperName } from '#lib/text/formatting.ts';
	import type { Gender } from '#lib/types.ts';
	import { findTemplateProblems } from '#lib/validation/certificateType.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.admin.certificateTypes;
	const placeholderLabel = (path: string) =>
		isTemplatePlaceholder(path) ? es.templatePlaceholders[path] : path;

	let title = $state('');
	let body = $state('');
	let isActive = $state(true);
	let previewGender = $state<Gender>('F');
	let saving = $state(false);
	let pdfError = $state(false);
	let textarea: HTMLTextAreaElement;

	// Seeded from the stored type, or from what was submitted when saving failed.
	$effect.pre(() => {
		title = form?.values?.title ?? data.type.title;
		body = form?.values?.body_template ?? data.type.body_template;
		isActive = form?.values?.is_active ?? data.type.is_active === 1;
	});

	const problems = $derived(findTemplateProblems(body));
	const usesSampleSigners = $derived(data.previewSigners.length < MIN_SIGNERS);
	const signers = $derived(usesSampleSigners ? SAMPLE_SIGNERS : data.previewSigners);
	const resident = $derived(SAMPLE_RESIDENTS[previewGender]);
	const preview = $derived(
		data.council
			? renderCertificateBody({
					template: body,
					council: data.council,
					resident,
					signers,
					knownSinceText: SAMPLE_KNOWN_SINCE,
					issuedAt: new Date().toISOString()
				})
			: null
	);
	// Unknown placeholders are reported as problems already.
	const emptyInPreview = $derived(preview?.missing.filter(isTemplatePlaceholder) ?? []);

	async function insertPlaceholder(path: string) {
		const text = `{{${path}}}`;
		const start = textarea.selectionStart ?? body.length;
		const end = textarea.selectionEnd ?? body.length;
		body = body.slice(0, start) + text + body.slice(end);
		await tick();
		textarea.focus();
		textarea.setSelectionRange(start + text.length, start + text.length);
	}

	function restoreDefault() {
		if (!confirm(t.restoreConfirm)) return;
		const original = DEFAULT_TEMPLATES[data.type.code];
		title = original.title;
		body = original.body;
	}

	async function toDataUrl(blob: Blob): Promise<string> {
		return new Promise((done, fail) => {
			const reader = new FileReader();
			reader.onload = () => done(String(reader.result));
			reader.onerror = () => fail(reader.error);
			reader.readAsDataURL(blob);
		});
	}

	async function openPdfPreview() {
		if (!data.council || !preview) return;
		pdfError = false;
		// Opened right away, inside the click, so popup blockers allow it.
		const tab = window.open('', '_blank');
		try {
			const council = data.council;
			let logoDataUrl: string | null = null;
			if (council.logo_r2_key) {
				const logo = await fetch(resolve('/api/files/[...key]', { key: council.logo_r2_key }));
				if (logo.ok) logoDataUrl = await toDataUrl(await logo.blob());
			}
			const { generateCertificatePdf } = await import('#lib/pdf/generateCertificatePdf.ts');
			const blob = await generateCertificatePdf({
				council: {
					name: council.name,
					taxId: council.tax_id,
					state: council.state,
					municipality: council.municipality,
					parish: council.parish,
					logoDataUrl
				},
				certificate: {
					title,
					serialNumber: '0000-0000',
					renderedBody: preview.body,
					residentName: toUpperName(`${resident.firstNames} ${resident.lastNames}`),
					validityNote: data.validityNote ?? ''
				},
				signers: signers.map((s) => ({
					shortName: s.shortName,
					roleTitle: s.roleTitle,
					phone: s.phone
				}))
			});
			const url = URL.createObjectURL(blob);
			if (tab) tab.location.href = url;
			else window.open(url, '_blank');
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} catch {
			tab?.close();
			pdfError = true;
		}
	}
</script>

<svelte:head>
	<title>{t.editTitle} · {es.app.name}</title>
</svelte:head>

<a href={resolve('/admin/certificate-types')} class="text-sm text-blue-700 hover:underline">
	{t.back}
</a>
<h1 class="mt-3 text-2xl font-bold">{t.editTitle}</h1>

{#if form?.saved}
	<p class="mt-4 rounded-md bg-green-50 p-3 text-green-800" role="status">{t.saved}</p>
{/if}
{#if form?.message}
	<p class="mt-4 rounded-md bg-red-50 p-3 text-red-800" role="alert">{form.message}</p>
{/if}
{#if data.pendingCount > 0}
	<p class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
		{t.pendingNotice.replace('{n}', String(data.pendingCount))}
	</p>
{/if}

<div class="mt-6 grid gap-8 xl:grid-cols-2">
	<form
		method="POST"
		class="space-y-5"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
	>
		<label class="block">
			<span class="text-sm font-medium">{t.fields.title}</span>
			<input
				name="title"
				bind:value={title}
				required
				maxlength="80"
				aria-describedby="title-hint"
				class="mt-1 block w-full rounded-md {form?.errors?.title
					? 'border-red-500'
					: 'border-slate-300'}"
			/>
			<span id="title-hint" class="mt-1 block text-xs text-slate-500">{t.fields.titleHint}</span>
			{#if form?.errors?.title}
				<span class="mt-1 block text-sm text-red-700">{es.formErrors[form.errors.title]}</span>
			{/if}
		</label>

		<label class="block">
			<span class="text-sm font-medium">{t.fields.body}</span>
			<textarea
				bind:this={textarea}
				name="body_template"
				bind:value={body}
				required
				maxlength="4000"
				rows="14"
				spellcheck="true"
				aria-describedby="body-hint body-problems"
				class="mt-1 block w-full rounded-md font-mono text-sm leading-relaxed {form?.errors
					?.body_template
					? 'border-red-500'
					: 'border-slate-300'}"></textarea>
			<span id="body-hint" class="mt-1 block text-xs text-slate-500">{t.fields.bodyHint}</span>
			{#if form?.errors?.body_template}
				<span class="mt-1 block text-sm text-red-700">
					{es.formErrors[form.errors.body_template]}
				</span>
			{/if}
		</label>

		<div id="body-problems" aria-live="polite">
			{#if problems.unknown.length > 0 || problems.missingRequired.length > 0 || problems.strayBraces}
				<div class="space-y-1 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
					{#if problems.unknown.length > 0}
						<p>{t.problems.unknown} {problems.unknown.map((p) => `{{${p}}}`).join(', ')}</p>
					{/if}
					{#if problems.missingRequired.length > 0}
						<p>
							{t.problems.missingRequired}
							{problems.missingRequired.map((p) => `{{${p}}}`).join(', ')}
						</p>
					{/if}
					{#if problems.strayBraces}<p>{t.problems.strayBraces}</p>{/if}
				</div>
			{/if}
		</div>

		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" name="is_active" bind:checked={isActive} class="rounded" />
			{t.fields.isActive}
		</label>

		<div class="flex flex-wrap gap-3">
			<button
				disabled={saving}
				class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
			>
				{saving ? t.saving : t.save}
			</button>
			<button
				type="button"
				onclick={restoreDefault}
				class="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
			>
				{t.restore}
			</button>
		</div>

		<section class="rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="font-medium">{t.placeholders}</h2>
			<p class="text-xs text-slate-500">{t.placeholdersHint}</p>
			{#each Object.entries(TEMPLATE_PLACEHOLDER_GROUPS) as [group, paths] (group)}
				<h3 class="mt-4 text-sm font-medium text-slate-700">
					{es.templatePlaceholderGroups[group as TemplatePlaceholderGroup]}
				</h3>
				<ul class="mt-1 space-y-1">
					{#each paths as path (path)}
						<li>
							<button
								type="button"
								onclick={() => insertPlaceholder(path)}
								class="w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100"
							>
								<code class="text-xs text-blue-800">{`{{${path}}}`}</code>
								<span class="block text-slate-600">{es.templatePlaceholders[path]}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/each}
		</section>
	</form>

	<section class="xl:sticky xl:top-4 xl:self-start">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">{t.preview}</h2>
				<p class="text-sm text-slate-500">{t.previewHint}</p>
			</div>
			<label class="text-sm">
				{t.previewResident}
				<select bind:value={previewGender} class="ml-1 rounded-md border-slate-300 py-1 text-sm">
					<option value="F">{es.gender.F}</option>
					<option value="M">{es.gender.M}</option>
				</select>
			</label>
		</div>

		{#if preview}
			{#if usesSampleSigners}
				<p class="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{t.sampleSigners}</p>
			{/if}
			{#if emptyInPreview.length > 0}
				<p class="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
					{t.emptyInPreview}
					{emptyInPreview.map(placeholderLabel).join('; ')}
				</p>
			{/if}
			<div class="mt-3 rounded-lg border border-slate-200 bg-white p-6" data-testid="preview">
				<p class="text-center italic">{title.toLocaleUpperCase('es-VE')}</p>
				<p class="mt-4 text-justify leading-relaxed italic">{preview.body}</p>
			</div>
			<button
				type="button"
				onclick={openPdfPreview}
				class="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
			>
				{t.previewPdf}
			</button>
			{#if pdfError}
				<p class="mt-2 text-sm text-red-700" role="alert">{t.previewPdfError}</p>
			{/if}
		{:else}
			<p class="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{t.noCouncil}</p>
		{/if}
	</section>
</div>
