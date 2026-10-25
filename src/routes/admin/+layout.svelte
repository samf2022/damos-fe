<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { es } from '#lib/i18n/es.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	const nav = es.admin.nav;

	const links = $derived(
		[
			{ href: resolve('/admin'), label: nav.dashboard },
			{ href: resolve('/admin/certificates'), label: nav.certificates },
			{ href: resolve('/admin/residents'), label: nav.residents },
			{ href: resolve('/admin/signers'), label: nav.signers },
			{ href: resolve('/admin/certificate-types'), label: nav.certificateTypes },
			{ href: resolve('/admin/settings'), label: nav.settings, adminOnly: true },
			{ href: resolve('/admin/users'), label: nav.users, adminOnly: true }
		].filter((link) => !link.adminOnly || data.user?.role === 'admin')
	);

	const isActive = (href: string) =>
		href === resolve('/admin') ? page.url.pathname === href : page.url.pathname.startsWith(href);
</script>

{#if data.user}
	<div class="flex min-h-screen flex-col md:flex-row">
		<aside class="border-b border-slate-200 bg-white md:w-60 md:border-r md:border-b-0">
			<div class="p-4 font-semibold">{es.admin.title}</div>
			<nav class="flex flex-wrap gap-1 px-2 pb-2 md:flex-col">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="rounded-md px-3 py-2 text-sm hover:bg-slate-100"
						class:bg-slate-100={isActive(link.href)}
						class:font-medium={isActive(link.href)}
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="border-t border-slate-200 p-4 text-sm">
				<p class="text-slate-500">{es.admin.signedInAs}</p>
				<p class="font-medium">{data.user.displayName}</p>
				<form method="POST" action={resolve('/admin/logout')} class="mt-2">
					<button class="text-blue-700 hover:underline">{es.admin.logout}</button>
				</form>
			</div>
		</aside>
		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</div>
{:else}
	<!-- Only /admin/login renders without a session (enforced in hooks.server.ts). -->
	{@render children()}
{/if}
