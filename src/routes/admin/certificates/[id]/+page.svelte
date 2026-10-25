<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import {
		MIN_SIGNERS,
		renderCertificateBody,
		residentAddress
	} from '#lib/certificates/renderCertificateBody.ts';
	import { es } from '#lib/i18n/es.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import { isMaritalStatus } from '#lib/text/genderAgreement.ts';
	import type { ResidentSnapshot } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.admin.review;

	const certificate = $derived(data.certificate);
	const isPending = $derived(certificate.status === 'pending');

	// Review form state, seeded from the request. The preview below re-renders as it changes.
	let knownSince = $state('');
	let selectedSignerIds = $state<string[]>([]);
	let submitting = $state<'approve' | 'reject' | null>(null);
	$effect.pre(() => {
		knownSince = data.certificate.known_since_text ?? '';
		selectedSignerIds = data.signers.filter((s) => s.is_default === 1).map((s) => s.id);
	});

	const preview = $derived(
		data.council
			? renderCertificateBody({
					template: certificate.type_template,
					council: data.council,
					resident: data.snapshot,
					signers: data.signers
						.filter((s) => selectedSignerIds.includes(s.id))
						.map((s) => ({ fullName: s.full_name, nationalId: s.national_id, gender: s.gender })),
					knownSinceText: knownSince,
					issuedAt: new Date().toISOString()
				})
			: null
	);

	const describe = (resident: ResidentSnapshot) => ({
		nationalId: resident.nationalId,
		fullName: `${resident.firstNames} ${resident.lastNames}`,
		gender: es.gender[resident.gender],
		maritalStatus: isMaritalStatus(resident.maritalStatus)
			? es.maritalStatus[resident.maritalStatus]
			: '—',
		occupation: resident.occupation ?? '—',
		address: residentAddress(resident),
		phone: resident.phone ?? '—'
	});
	const submitted = $derived(describe(data.snapshot));
	const record = $derived(describe(data.resident));
	const fieldKeys = Object.keys(t.fields) as (keyof typeof t.fields)[];
	const hasDiff = $derived(fieldKeys.some((key) => submitted[key] !== record[key]));

	const submitWith = (action: 'approve' | 'reject') => () => {
		submitting = action;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			submitting = null;
		};
	};
</script>

<svelte:head>
	<title>{es.admin.certificates.detailTitle} · {es.app.name}</title>
</svelte:head>

<a href={resolve('/admin/certificates')} class="text-sm text-blue-700 hover:underline">
	{es.admin.certificates.back}
</a>

<header class="mt-3 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-bold">{certificate.type_title}</h1>
	<StatusBadge status={certificate.status} />
</header>
<p class="mt-1 text-sm text-slate-500">{t.submittedAt} {formatDate(certificate.submitted_at)}</p>

{#if form?.message}
	<p class="mt-4 rounded-md bg-red-50 p-3 text-red-800" role="alert">{form.message}</p>
{/if}

<!-- Submitted data vs. current resident record -->
<section class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
	<table class="w-full text-left text-sm">
		<thead class="border-b border-slate-200 bg-slate-50 text-slate-600">
			<tr>
				<th class="w-40 px-3 py-2"></th>
				<th class="px-3 py-2 font-medium">{t.submittedData}</th>
				{#if hasDiff}<th class="px-3 py-2 font-medium">{t.residentRecord}</th>{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#each fieldKeys as key (key)}
				{@const differs = submitted[key] !== record[key]}
				<tr class:bg-amber-50={differs}>
					<th class="px-3 py-2 font-normal text-slate-500">{t.fields[key]}</th>
					<td class="px-3 py-2" class:font-medium={differs}>{submitted[key]}</td>
					{#if hasDiff}<td class="px-3 py-2 text-slate-600">{record[key]}</td>{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if hasDiff}
		<p class="border-t border-slate-200 px-3 py-2 text-sm text-amber-900">{t.differs}</p>
	{/if}
</section>

{#if isPending}
	<div class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
		<section>
			<h2 class="text-lg font-semibold">{t.preview}</h2>
			<p class="text-sm text-slate-500">{t.previewNote}</p>
			{#if preview}
				{#if preview.missing.length > 0}
					<p class="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
						{t.missing}
						{preview.missing.join(', ')}
					</p>
				{/if}
				<div
					class="mt-3 rounded-lg border border-slate-200 bg-white p-6 text-justify leading-relaxed whitespace-pre-line"
				>
					{preview.body}
				</div>
			{:else}
				<p class="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
					{t.errors.no_council}
				</p>
			{/if}
		</section>

		<aside class="space-y-6">
			<form
				method="POST"
				action="?/approve"
				class="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
				use:enhance={submitWith('approve')}
			>
				<label class="block">
					<span class="text-sm font-medium">{t.knownSince}</span>
					<input
						name="known_since_text"
						bind:value={knownSince}
						required
						maxlength="60"
						class="mt-1 block w-full rounded-md border-slate-300"
					/>
				</label>

				<fieldset>
					<legend class="text-sm font-medium">{t.signers}</legend>
					<p class="text-xs text-slate-500">{t.signersHint}</p>
					<div class="mt-2 space-y-2">
						{#each data.signers as signer (signer.id)}
							<label class="flex items-start gap-2 text-sm">
								<input
									type="checkbox"
									name="signer_ids"
									value={signer.id}
									bind:group={selectedSignerIds}
									class="mt-0.5 rounded"
								/>
								<span>
									{signer.full_name}
									<span class="block text-slate-500">{signer.role_title}</span>
								</span>
							</label>
						{/each}
					</div>
				</fieldset>

				{#if hasDiff}
					<label class="flex items-start gap-2 text-sm">
						<input type="checkbox" name="update_resident" class="mt-0.5 rounded" />
						<span>{t.updateResident}</span>
					</label>
				{/if}

				<button
					disabled={submitting !== null ||
						selectedSignerIds.length < MIN_SIGNERS ||
						!preview ||
						preview.missing.length > 0}
					class="w-full rounded-md bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
				>
					{submitting === 'approve' ? t.approving : t.approve}
				</button>
			</form>

			<form
				method="POST"
				action="?/reject"
				class="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
				use:enhance={submitWith('reject')}
			>
				<label class="block">
					<span class="text-sm font-medium">{t.rejectReason}</span>
					<textarea
						name="rejection_reason"
						required
						minlength="5"
						maxlength="500"
						rows="3"
						class="mt-1 block w-full rounded-md border-slate-300"
						>{form?.action === 'reject' && 'reason' in form ? (form.reason ?? '') : ''}</textarea
					>
					<span class="text-xs text-slate-500">{t.rejectReasonHint}</span>
				</label>
				<button
					disabled={submitting !== null}
					class="w-full rounded-md border border-red-700 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
				>
					{submitting === 'reject' ? t.rejecting : t.reject}
				</button>
			</form>
		</aside>
	</div>
{:else if certificate.status === 'approved'}
	<section class="mt-8 space-y-6">
		<h2 class="text-lg font-semibold">{t.approvedTitle}</h2>
		<dl
			class="grid gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[max-content_1fr]"
		>
			<dt class="text-sm text-slate-500">{t.serialNumber}</dt>
			<dd class="font-medium">{certificate.serial_number}</dd>
			<dt class="text-sm text-slate-500">{t.verificationCode}</dt>
			<dd class="font-mono">{certificate.verification_code}</dd>
			{#if data.verificationUrl}
				<dt class="text-sm text-slate-500">{t.verificationLink}</dt>
				<dd class="break-all">
					<!-- Absolute public URL, not an app route. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={data.verificationUrl}
						class="text-blue-700 hover:underline"
						target="_blank"
						rel="noopener"
					>
						{data.verificationUrl}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</dd>
			{/if}
			<dt class="text-sm text-slate-500">{t.issuedAt}</dt>
			<dd>{certificate.issued_at ? formatDate(certificate.issued_at) : '—'}</dd>
			<dt class="text-sm text-slate-500">{t.expiresAt}</dt>
			<dd>{certificate.expires_at ? formatDate(certificate.expires_at) : '—'}</dd>
			<dt class="text-sm text-slate-500">{t.reviewedBy}</dt>
			<dd>{certificate.reviewer_name ?? '—'}</dd>
			<dt class="text-sm text-slate-500">{t.signers}</dt>
			<dd>
				{#each data.issuedSigners as signer (signer.full_name)}
					<span class="block">{signer.full_name} · {signer.role_title}</span>
				{/each}
			</dd>
		</dl>
		<div>
			<h3 class="font-medium">{t.finalText}</h3>
			<div
				class="mt-2 rounded-lg border border-slate-200 bg-white p-6 text-justify leading-relaxed whitespace-pre-line"
			>
				{certificate.rendered_body}
			</div>
		</div>
		<p class="text-sm text-slate-500">{t.nextSteps}</p>
	</section>
{:else}
	<section class="mt-8">
		<h2 class="text-lg font-semibold">{t.rejectedTitle}</h2>
		<dl
			class="mt-3 grid gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[max-content_1fr]"
		>
			<dt class="text-sm text-slate-500">{t.rejectReason}</dt>
			<dd>{certificate.rejection_reason}</dd>
			<dt class="text-sm text-slate-500">{t.reviewedBy}</dt>
			<dd>{certificate.reviewer_name ?? '—'}</dd>
			<dt class="text-sm text-slate-500">{t.reviewedAt}</dt>
			<dd>{certificate.reviewed_at ? formatDate(certificate.reviewed_at) : '—'}</dd>
		</dl>
	</section>
{/if}
