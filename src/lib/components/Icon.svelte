<script lang="ts">
	type Props = {
		name: string;
		class?: string;
	};

	let { name, class: className = '' }: Props = $props();

	const paths: Record<string, string> = {
		home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z',
		folder:
			'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
		note: 'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 1.5V9h4.5',
		settings:
			'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0-5.5.9 2.1 2.3-.3 1.1 2-1.8 1.3.7 2.2-2.1.9-.7 2.2-2.2-.7-1.3 1.8-2-.1-.3-2.3L5.5 12l2.1-.9.3-2.3-1.8-1.3.1-2 2.3.3L12 3z',
		menu: 'M4 7h16M4 12h16M4 17h16',
		logout: 'M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m4-8h8m-4-4 4 4-4 4'
	};

	const d = $derived(paths[name] ?? paths.home);
	const strokeIcons = new Set(['menu', 'logout', 'note']);
</script>

{#if strokeIcons.has(name)}
	<svg
		class="inline-block size-4 shrink-0 {className}"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d={d} />
	</svg>
{:else}
	<svg
		class="inline-block size-4 shrink-0 {className}"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d={d} />
	</svg>
{/if}
