<script lang="ts">
	import { enhance } from '$app/forms';
	import PublicShell from '#lib/components/PublicShell.svelte';
	import { es } from '#lib/i18n/es.ts';
	import { MARITAL_STATUSES } from '#lib/text/genderAgreement.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = es.request;
	const field = 'mt-1 block w-full rounded-md border-slate-300';
</script>

<PublicShell>
	<h1 class="text-2xl font-bold">{t.title}</h1>
	<p class="mt-2 text-slate-600">{t.description}</p>

	{#if data.certificateTypes.length === 0}
		<p class="mt-6 rounded-md bg-amber-50 p-3 text-amber-900">{t.noTypes}</p>
	{:else}
		<!-- Placeholder form: final layout and validation come in the next milestone. -->
		<form method="POST" use:enhance class="mt-6 grid gap-4 sm:grid-cols-2">
			<label class="sm:col-span-2">
				<span class="text-sm font-medium">{t.certificateType}</span>
				<select name="certificate_type_id" required class={field}>
					<option value="">{t.selectType}</option>
					{#each data.certificateTypes as type (type.id)}
						<option value={type.id}>{type.title}</option>
					{/each}
				</select>
			</label>

			<label>
				<span class="text-sm font-medium">{t.resident.nationalId}</span>
				<input name="national_id" required placeholder={t.resident.nationalIdHint} class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.gender}</span>
				<select name="gender" required class={field}>
					<option value="F">{es.gender.F}</option>
					<option value="M">{es.gender.M}</option>
				</select>
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.firstNames}</span>
				<input name="first_names" required class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.lastNames}</span>
				<input name="last_names" required class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.maritalStatus}</span>
				<select name="marital_status" class={field}>
					{#each MARITAL_STATUSES as status (status)}
						<option value={status}>{es.maritalStatus[status]}</option>
					{/each}
				</select>
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.occupation}</span>
				<input name="occupation" class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.streetAddress}</span>
				<input name="street_address" required class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.houseNumber}</span>
				<input name="house_number" class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.resident.phone}</span>
				<input name="phone" type="tel" placeholder={t.resident.phoneHint} class={field} />
			</label>
			<label>
				<span class="text-sm font-medium">{t.knownSince}</span>
				<input name="known_since_text" placeholder={t.knownSinceHint} class={field} />
			</label>

			{#if form?.message}
				<p class="rounded-md bg-amber-50 p-3 text-amber-900 sm:col-span-2" role="alert">
					{form.message}
				</p>
			{/if}

			<button
				class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 sm:col-span-2"
			>
				{t.submit}
			</button>
		</form>
	{/if}
</PublicShell>
