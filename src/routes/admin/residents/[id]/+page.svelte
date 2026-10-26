<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { es } from '#lib/i18n/es.ts';
	import { isInForce } from '#lib/certificates/inForce.ts';
	import { formatDate } from '#lib/text/formatDate.ts';
	import { MARITAL_STATUSES } from '#lib/text/genderAgreement.ts';
	import type { ResidentField } from '#lib/validation/resident.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.admin.residents;
	const f = es.request.resident;

	const stored = $derived<Record<ResidentField, string>>({
		national_id: data.resident.national_id,
		first_names: data.resident.first_names,
		last_names: data.resident.last_names,
		gender: data.resident.gender,
		marital_status: data.resident.marital_status ?? '',
		occupation: data.resident.occupation ?? '',
		street_address: data.resident.street_address,
		house_number: data.resident.house_number ?? '',
		phone: data.resident.phone ?? ''
	});
	const value = (field: ResidentField) => form?.values?.[field] ?? stored[field];
	const error = (field: ResidentField) => form?.errors?.[field];

	const pendingCount = $derived(data.certificates.filter((c) => c.status === 'pending').length);
	const inForce = $derived(data.certificates.filter((c) => isInForce(c)));
	let saving = $state(false);
</script>

<svelte:head>
	<title>{data.resident.first_names} {data.resident.last_names} · {es.app.name}</title>
</svelte:head>

{#if data.from}
	<a
		href={resolve('/admin/certificates/[id]', { id: data.from })}
		class="text-sm text-blue-700 hover:underline"
	>
		{t.backToRequest}
	</a>
{:else}
	<a href={resolve('/admin/residents')} class="text-sm text-blue-700 hover:underline">{t.back}</a>
{/if}
<h1 class="mt-3 text-2xl font-bold">{data.resident.first_names} {data.resident.last_names}</h1>
<p class="text-slate-500">{data.resident.national_id}</p>

{#if form?.saved}
	<p class="mt-4 rounded-md bg-green-50 p-3 text-green-800" role="status">
		{form.updatedPending ? t.savedWithPending.replace('{n}', String(form.updatedPending)) : t.saved}
	</p>
{/if}
{#if inForce.length > 0}
	<p class="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
		{t.inForceSummary}
		{inForce
			.map((c) => `${c.type_title} (${t.inForce.toLowerCase()} ${formatDate(c.expires_at!)})`)
			.join('; ')}
	</p>
{/if}

<div class="mt-6 grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
	<section>
		<h2 class="text-lg font-semibold">{t.dataTitle}</h2>
		<form
			method="POST"
			class="mt-3 grid gap-4 sm:grid-cols-2"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
				};
			}}
		>
			<TextField
				name="national_id"
				label={f.nationalId}
				placeholder={f.nationalIdHint}
				value={value('national_id')}
				error={error('national_id')}
				maxlength={20}
			/>
			<label class="block">
				<span class="text-sm font-medium">{f.gender}</span>
				<select
					name="gender"
					required
					class="mt-1 block w-full rounded-md {error('gender')
						? 'border-red-500'
						: 'border-slate-300'}"
				>
					<option value="F" selected={value('gender') === 'F'}>{es.gender.F}</option>
					<option value="M" selected={value('gender') === 'M'}>{es.gender.M}</option>
				</select>
			</label>
			<TextField
				name="first_names"
				label={f.firstNames}
				value={value('first_names')}
				error={error('first_names')}
				maxlength={80}
			/>
			<TextField
				name="last_names"
				label={f.lastNames}
				value={value('last_names')}
				error={error('last_names')}
				maxlength={80}
			/>
			<label class="block">
				<span class="text-sm font-medium">{f.maritalStatus}</span>
				<select
					name="marital_status"
					required
					class="mt-1 block w-full rounded-md {error('marital_status')
						? 'border-red-500'
						: 'border-slate-300'}"
				>
					<option value="" disabled selected={!value('marital_status')}>—</option>
					{#each MARITAL_STATUSES as status (status)}
						<option value={status} selected={value('marital_status') === status}>
							{es.maritalStatus[status]}
						</option>
					{/each}
				</select>
				{#if error('marital_status')}
					<span class="mt-1 block text-sm text-red-700">
						{es.formErrors[error('marital_status')!]}
					</span>
				{/if}
			</label>
			<TextField
				name="occupation"
				label={f.occupation}
				optional
				value={value('occupation')}
				error={error('occupation')}
				maxlength={80}
			/>
			<TextField
				name="street_address"
				label={f.streetAddress}
				value={value('street_address')}
				error={error('street_address')}
				maxlength={160}
			/>
			<TextField
				name="house_number"
				label={f.houseNumber}
				optional
				value={value('house_number')}
				error={error('house_number')}
				maxlength={40}
			/>
			<TextField
				name="phone"
				label={f.phone}
				placeholder={f.phoneHint}
				type="tel"
				inputmode="tel"
				optional
				value={value('phone')}
				error={error('phone')}
				maxlength={20}
			/>

			<div class="space-y-3 sm:col-span-2">
				{#if pendingCount > 0}
					<label class="flex items-start gap-2 text-sm">
						<input
							type="checkbox"
							name="apply_to_pending"
							checked={data.from !== null}
							class="mt-0.5 rounded"
						/>
						<span>{t.applyToPending.replace('{n}', String(pendingCount))}</span>
					</label>
				{/if}
				<p class="text-xs text-slate-500">{t.pendingHint}</p>
				<button
					disabled={saving}
					class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
				>
					{saving ? t.saving : t.save}
				</button>
			</div>
		</form>
	</section>

	<section>
		<h2 class="text-lg font-semibold">{t.historyTitle}</h2>
		{#if data.certificates.length === 0}
			<p class="mt-3 text-slate-500">{t.noCertificates}</p>
		{:else}
			<ul class="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
				{#each data.certificates as certificate (certificate.id)}
					<li class="p-3">
						<div class="flex flex-wrap items-center gap-2">
							<a
								href={resolve('/admin/certificates/[id]', { id: certificate.id })}
								class="font-medium text-blue-700 hover:underline"
							>
								{certificate.type_title}
							</a>
							<StatusBadge status={certificate.status} />
						</div>
						<p class="mt-1 text-sm text-slate-500">
							{t.submitted}
							{formatDate(certificate.submitted_at)}
							{#if certificate.serial_number}· {t.serial} {certificate.serial_number}{/if}
						</p>
						{#if certificate.status === 'approved' && certificate.expires_at}
							<p class="text-sm {isInForce(certificate) ? 'text-green-800' : 'text-slate-500'}">
								{isInForce(certificate)
									? `${t.inForce} ${formatDate(certificate.expires_at)}`
									: t.expired}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
