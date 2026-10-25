<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { es } from '#lib/i18n/es.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{es.app.name}</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900">
	{@render children()}
</div>
