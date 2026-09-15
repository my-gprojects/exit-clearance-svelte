<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Icon from '$lib/components/Icon.svelte';

	let { data, children } = $props();

	let sidebarExpanded = $state(true);
	let menuOpen = $state(false);

	function isActive(url: string) {
		const path = $page.url.pathname;
		return path === url || path.startsWith(url + '/');
	}
</script>

{#if data.user}
	<div class="flex min-h-screen flex-col bg-(--app-bg) text-(--app-text)">
		<nav class="fixed top-0 z-50 w-full border-b border-(--app-border) bg-(--navbar-bg) shadow-sm">
			<div class="grid h-13 grid-cols-2">
				<div class="flex items-center px-3">
					<div class="flex flex-row items-center gap-4">
						<button
							type="button"
							class="btn btn-icon rounded-md border border-(--sidebar-toggle-border) bg-(--sidebar-toggle-bg) text-(--sidebar-toggle-text) hover:border-(--sidebar-toggle-hover-border) hover:bg-(--sidebar-toggle-hover-bg) active:border-(--sidebar-toggle-active-border) active:bg-(--sidebar-toggle-active-bg)"
							title="Menu"
							aria-label="Toggle sidebar"
							onclick={() => (sidebarExpanded = !sidebarExpanded)}
						>
							<Icon name="menu" class="text-(--app-text)" />
						</button>

						<div class="flex h-9 w-19 items-center justify-center rounded-md bg-(--app-surface-2) text-xs font-semibold text-(--app-muted)">
							EC
						</div>

						<div class="flex flex-col">
							<span class="text-sm font-semibold text-(--navbar-app-name-text)">
								Exit Clearance
							</span>
							<span class="text-xs italic text-(--navbar-app-description-text)">
								Employee offboarding clearance
							</span>
						</div>
					</div>
				</div>

				<div class="relative flex h-full items-center justify-end">
					<button
						type="button"
						class="btn flex h-full !h-full flex-row items-center gap-2 rounded-none px-3 hover:bg-(--app-surface-2)"
						aria-expanded={menuOpen}
						aria-haspopup="menu"
						onclick={() => (menuOpen = !menuOpen)}
					>
						<span class="ml-5 mr-4 text-sm text-(--app-text)">{data.user.displayName}</span>
						<span
							class="flex h-7 w-7 items-center justify-center rounded-full bg-(--app-surface-2) text-xs font-semibold ring-1 ring-(--app-border)"
						>
							{data.user.displayName.slice(0, 1)}
						</span>
					</button>

					{#if menuOpen}
						<div role="menu" class="app-dropdown absolute right-2 top-full z-50 mt-1 min-w-44 py-1">
							<form method="POST" action="/logout" use:enhance>
								<button
									type="submit"
									role="menuitem"
									class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-(--app-text) hover:bg-(--app-surface-2)"
								>
									<Icon name="logout" />
									Sign out
								</button>
							</form>
						</div>
					{/if}
				</div>
			</div>
		</nav>

		<aside
			class="fixed top-13 bottom-0 z-40 border-r border-(--app-border) bg-(--app-surface) transition-all {sidebarExpanded
				? 'w-64'
				: 'w-16'}"
		>
			<nav class="flex h-full flex-col py-2" aria-label="Main">
				{#each data.navigation as item}
					{@const active = isActive(item.url)}
					<a
						href={item.url}
						title={item.name}
						class="mx-2 mb-1 flex h-10 min-h-10 items-center overflow-hidden rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) {sidebarExpanded
							? 'w-[calc(100%-1rem)] gap-3 px-3'
							: 'w-fit shrink-0 self-start px-3'} {active
							? 'bg-(--sidebar-selected-parent-bg) font-semibold text-(--sidebar-selected-text)'
							: 'text-(--app-text) hover:bg-(--sidebar-hover-parent-bg)'}"
					>
						<Icon name={item.iconClass} />
						{#if sidebarExpanded}
							<span class="min-w-0 flex-1 truncate">{item.name}</span>
						{/if}
					</a>
				{/each}
			</nav>
		</aside>

		<div
			class="mt-14 mb-4 w-full pt-4 pr-5 transition-all {sidebarExpanded ? 'pl-69' : 'pl-21'}"
		>
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}
