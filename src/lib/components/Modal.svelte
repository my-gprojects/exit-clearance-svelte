<script lang="ts">
	import type { Snippet } from 'svelte';

	type Size = 'sm' | 'md' | 'xl';

	let {
		open = false,
		title,
		size = 'md',
		onClose,
		children,
		footer
	}: {
		open?: boolean;
		title: string;
		size?: Size;
		onClose: () => void;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	const sizeClass: Record<Size, string> = {
		sm: 'w-[92%] max-w-sm',
		md: 'w-[92%] max-w-lg',
		xl: 'w-[92%] max-w-2xl'
	};

	let mounted = $state(false);
	let visible = $state(false);

	$effect(() => {
		if (open) {
			mounted = true;
			const t = window.setTimeout(() => (visible = true), 16);
			return () => window.clearTimeout(t);
		}
		visible = false;
		const t = window.setTimeout(() => (mounted = false), 250);
		return () => window.clearTimeout(t);
	});
</script>

{#if mounted}
	<div
		class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 transition-opacity {visible
			? 'opacity-100'
			: 'pointer-events-none opacity-0'}"
	>
		<button
			type="button"
			aria-label="Close modal overlay"
			class="absolute inset-0 cursor-default"
			onclick={onClose}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			class="relative z-10 m-0 flex max-h-[95vh] flex-col overflow-hidden rounded-lg border border-(--app-border) bg-(--app-surface) p-0 shadow-lg transition-all {sizeClass[
				size
			]} {visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}"
		>
			<div class="relative w-full border-b border-(--app-border) px-4 py-2">
				<h2 class="pr-7 text-lg font-semibold text-(--app-text)">{title}</h2>
				<button
					type="button"
					onclick={onClose}
					title="Close"
					class="absolute top-2.5 right-2.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-(--app-text) opacity-60 hover:opacity-100"
				>
					×
				</button>
			</div>
			<div class="w-full max-h-[70vh] overflow-y-auto p-4 text-sm text-(--app-text)">
				{@render children()}
			</div>
			{#if footer}
				<div class="flex w-full items-center justify-end gap-2 border-t border-(--app-border) px-4 py-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
