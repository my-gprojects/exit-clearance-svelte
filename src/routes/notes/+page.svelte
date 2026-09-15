<script lang="ts">
	let { data } = $props();
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-xl font-semibold text-(--app-text)">Notes</h1>
		<p class="text-sm text-(--app-muted)">Personal notes from the static JSON store.</p>
	</div>

	{#if data.notes.length === 0}
		<div class="app-panel px-3 py-4 text-sm text-(--app-muted)">No notes yet.</div>
	{:else}
		<div class="space-y-3">
			{#each data.notes as note}
				<article class="app-panel p-4">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="text-base font-semibold">{note.title}</h2>
						<span class="text-xs text-(--app-muted)">{note.createdAt.slice(0, 10)}</span>
					</div>
					<p class="mt-2 text-sm text-(--app-text)">{note.body}</p>
				</article>
			{/each}
		</div>
	{/if}
</div>
