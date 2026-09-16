<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const tabs = [
		{ href: '/admin/users', label: 'Users & roles' },
		{ href: '/admin/exit-interviewers', label: 'Exit interviewers' },
		{ href: '/admin/task-templates', label: 'Task attachments' }
	] as const;

	function isActive(href: string) {
		const path = $page.url.pathname;
		return path === href || path.startsWith(`${href}/`);
	}
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-xl font-semibold text-(--app-text)">Admin</h1>
		<p class="text-sm text-(--app-muted)">
			Role assignment, exit interviewer mapping, and task attachment settings.
		</p>
	</div>
	<nav class="flex flex-wrap gap-2 border-b border-(--app-border) pb-2">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="px-3 py-1.5 text-sm transition-colors {isActive(tab.href)
					? 'border-b-2 border-(--focus-ring) font-semibold text-(--focus-ring)'
					: 'text-(--app-muted) hover:text-(--app-text)'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>
	{@render children()}
</div>
