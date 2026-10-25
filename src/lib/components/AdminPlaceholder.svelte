<script lang="ts">
	import { es } from '#lib/i18n/es.ts';

	let { title }: { title: string } = $props();
</script>

<svelte:head>
	<title>{title} · {es.app.name}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{title}</h1>
<p class="mt-2 text-slate-600">{es.admin.placeholder}</p>
