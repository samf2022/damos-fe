<script lang="ts">
	import { es } from '#lib/i18n/es.ts';
	import type { CertificateStatus } from '#lib/types.ts';

	let { status }: { status: CertificateStatus } = $props();

	const styles: Record<CertificateStatus, string> = {
		pending: 'bg-amber-100 text-amber-900',
		approved: 'bg-green-100 text-green-900',
		rejected: 'bg-red-100 text-red-900'
	};
</script>

<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {styles[status]}">
	{es.certificateStatus[status]}
</span>
