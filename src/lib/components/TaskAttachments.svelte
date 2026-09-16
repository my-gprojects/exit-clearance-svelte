<script lang="ts">
	type Attachment = {
		attachmentId: number;
		originalFileName: string;
		fileSizeBytes: number;
		uploadedByDisplayName: string;
	};

	let { taskId }: { taskId: number } = $props();

	let items = $state<Attachment[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function formatBytes(n: number) {
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/tasks/${taskId}/attachments`, { cache: 'no-store' });
			const payload = (await res.json()) as {
				data?: { attachments?: Attachment[] };
				error?: string | null;
			};
			if (!res.ok) {
				error = payload.error || 'Failed to load attachments';
				items = [];
				return;
			}
			items = payload.data?.attachments ?? [];
		} catch {
			error = 'Failed to load attachments';
			items = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void taskId;
		void load();
	});
</script>

{#if loading}
	<p class="mt-2 border-t border-(--app-border) pt-2 text-xs text-(--app-muted)">Loading…</p>
{:else if error}
	<p class="mt-2 border-t border-(--app-border) pt-2 text-xs text-(--form-error-text)">{error}</p>
{:else if items.length > 0}
	<div class="mt-2 space-y-1 border-t border-(--app-border) pt-2">
		<p class="text-xs font-medium text-(--app-muted)">Attachments</p>
		<ul class="space-y-1">
			{#each items as a}
				<li class="text-xs text-(--app-text)">
					{a.originalFileName}
					<span class="text-(--app-muted)">
						· {formatBytes(a.fileSizeBytes)} · {a.uploadedByDisplayName}
					</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}
