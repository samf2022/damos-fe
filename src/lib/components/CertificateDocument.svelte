<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { es } from '#lib/i18n/es.ts';
	import type { CertificatePdfInput } from '#lib/pdf/generateCertificatePdf.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import { buildWhatsAppLink } from '#lib/whatsapp.ts';

	let {
		pdf,
		pdfKey,
		phone,
		whatsappSentAt
	}: {
		pdf: {
			input: Omit<CertificatePdfInput, 'council'> & {
				council: Omit<CertificatePdfInput['council'], 'logoDataUrl'>;
			};
			logoKey: string | null;
			fileName: string;
			whatsappMessage: string;
		};
		pdfKey: string | null;
		phone: string | null;
		whatsappSentAt: string | null;
	} = $props();

	const t = es.admin.review.document;
	let busy = $state<'generating' | 'sending' | null>(null);
	let errorMessage = $state('');
	/** Fetched ahead of time so navigator.share() still runs within the click's user activation. */
	let pdfFile = $state<File | null>(null);

	const whatsappLink = $derived(phone ? buildWhatsAppLink(phone, pdf.whatsappMessage) : null);

	async function toDataUrl(blob: Blob): Promise<string> {
		return new Promise((done, fail) => {
			const reader = new FileReader();
			reader.onload = () => done(String(reader.result));
			reader.onerror = () => fail(reader.error);
			reader.readAsDataURL(blob);
		});
	}

	async function postAction(action: string, body?: FormData) {
		const response = await fetch(`?/${action}`, {
			method: 'POST',
			body: body ?? new FormData(),
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		if (result.type === 'failure') {
			throw new Error(String((result.data as { message?: string })?.message ?? t.errors.generate));
		}
		if (result.type === 'error') throw new Error(t.errors.generate);
	}

	async function generate() {
		busy = 'generating';
		errorMessage = '';
		try {
			let logoDataUrl: string | null = null;
			if (pdf.logoKey) {
				const logo = await fetch(resolve('/api/files/[...key]', { key: pdf.logoKey }));
				if (logo.ok) logoDataUrl = await toDataUrl(await logo.blob());
			}
			const { generateCertificatePdf } = await import('#lib/pdf/generateCertificatePdf.ts');
			const blob = await generateCertificatePdf({
				...pdf.input,
				council: { ...pdf.input.council, logoDataUrl }
			});
			const file = new File([blob], pdf.fileName, { type: 'application/pdf' });
			const body = new FormData();
			body.append('pdf', file);
			await postAction('savePdf', body);
			pdfFile = file;
			await invalidateAll();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : t.errors.generate;
		} finally {
			busy = null;
		}
	}

	async function loadStoredPdf(key: string) {
		const response = await fetch(resolve('/api/files/[...key]', { key }));
		if (response.ok) {
			pdfFile = new File([await response.blob()], pdf.fileName, { type: 'application/pdf' });
		}
	}

	function download(file: File) {
		const url = URL.createObjectURL(file);
		const link = document.createElement('a');
		link.href = url;
		link.download = file.name;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 10_000);
	}

	const canShareFiles = () =>
		typeof navigator.canShare === 'function' &&
		navigator.canShare({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });

	async function sendByWhatsApp() {
		if (!pdfFile) return;
		errorMessage = '';
		busy = 'sending';
		try {
			if (canShareFiles()) {
				// Phones: the system share sheet attaches the PDF directly in WhatsApp.
				await navigator.share({ files: [pdfFile], text: pdf.whatsappMessage });
			} else {
				// Desktop: open the chat (synchronously, to avoid popup blockers) and download the PDF.
				if (whatsappLink) window.open(whatsappLink, '_blank', 'noopener');
				download(pdfFile);
			}
			await postAction('markWhatsAppSent');
			await invalidateAll();
		} catch (error) {
			// Closing the share sheet is not an error.
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				errorMessage = error instanceof Error ? error.message : t.errors.generate;
			}
		} finally {
			busy = null;
		}
	}

	onMount(() => {
		if (pdfKey) loadStoredPdf(pdfKey);
		else generate();
	});
</script>

<section class="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
	<h3 class="font-medium">{t.title}</h3>

	{#if errorMessage}
		<p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{errorMessage}</p>
	{/if}

	{#if busy === 'generating'}
		<p class="text-sm text-slate-600" role="status">{t.generating}</p>
	{:else if !pdfKey}
		<p class="text-sm text-slate-600">{t.missing}</p>
	{/if}

	<div class="flex flex-wrap gap-3">
		{#if pdfKey}
			<a
				href={resolve('/api/files/[...key]', { key: pdfKey })}
				target="_blank"
				rel="noopener"
				class="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
			>
				{t.view}
			</a>
			<button
				type="button"
				onclick={sendByWhatsApp}
				disabled={busy !== null || !pdfFile}
				class="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
			>
				{t.whatsapp}
			</button>
		{/if}
		<button
			type="button"
			onclick={generate}
			disabled={busy !== null}
			class="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
		>
			{pdfKey ? t.regenerate : t.generate}
		</button>
	</div>

	<p class="text-xs text-slate-500">
		{phone ? t.whatsappDesktopHint : t.whatsappNoPhone}
	</p>
	{#if pdfKey}
		<p class="text-xs text-slate-500">{t.regenerateHint}</p>
	{/if}
	{#if whatsappSentAt}
		<p class="text-sm text-green-800">{t.whatsappSentAt} {formatDate(whatsappSentAt)}</p>
	{/if}
</section>
