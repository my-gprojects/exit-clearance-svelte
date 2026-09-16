<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import type { TaskActionMode } from '$lib/types';

	let {
		open = false,
		taskId,
		taskTitle,
		mode,
		allowAttachments = false,
		onClose
	}: {
		open?: boolean;
		taskId: number;
		taskTitle: string;
		mode: TaskActionMode;
		allowAttachments?: boolean;
		onClose: () => void;
	} = $props();

	let notes = $state('');
	let targetStatus = $state<'pending' | 'in_progress'>('pending');
	let file = $state<File | null>(null);
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (!open) return;
		notes = '';
		targetStatus = 'pending';
		file = null;
		error = '';
	});

	const title = $derived(
		mode === 'complete'
			? 'Complete task'
			: mode === 'skip'
				? 'Skip task'
				: mode === 'rollback'
					? 'Reopen task'
					: 'Start task'
	);
	const showNotes = $derived(mode !== 'start');
	const showAttachment = $derived(mode === 'complete' && allowAttachments);
	const notesRequired = $derived(mode === 'rollback');

	async function submit() {
		error = '';
		if (notesRequired && !notes.trim()) {
			error = 'Rollback reason is required.';
			return;
		}
		loading = true;
		try {
			if (showAttachment && file) {
				const body = new FormData();
				body.append('file', file);
				const uploadRes = await fetch(`/api/tasks/${taskId}/attachments`, {
					method: 'POST',
					body
				});
				const uploadPayload = (await uploadRes.json()) as { error?: string | null };
				if (!uploadRes.ok) {
					error = uploadPayload.error || 'Attachment upload failed';
					return;
				}
			}

			const path =
				mode === 'complete'
					? `/api/tasks/${taskId}/complete`
					: mode === 'skip'
						? `/api/tasks/${taskId}/skip`
						: mode === 'rollback'
							? `/api/tasks/${taskId}/rollback`
							: `/api/tasks/${taskId}/start`;

			const res = await fetch(path, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(
					mode === 'start'
						? {}
						: mode === 'rollback'
							? { notes: notes.trim(), targetStatus }
							: { notes: notes.trim() || null }
				)
			});
			const payload = (await res.json()) as { error?: string | null };
			if (!res.ok) {
				error = payload.error || 'Action failed';
				return;
			}
			await invalidateAll();
			onClose();
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<Modal {open} {title} {onClose}>
	{#snippet children()}
		<div class="space-y-3">
			<p class="text-sm text-(--app-muted)">{taskTitle}</p>
			{#if error}
				<p class="text-sm text-(--form-error-text)" role="alert">{error}</p>
			{/if}
			{#if showNotes}
				<label for="task-notes" class="block text-sm font-medium">
					{notesRequired ? 'Reason (required)' : 'Notes (optional)'}
				</label>
				<textarea
					id="task-notes"
					rows="4"
					maxlength="2000"
					bind:value={notes}
					class="app-input w-full px-3 py-2 text-sm"
				></textarea>
				{#if mode === 'rollback'}
					<div class="space-y-1">
						<label for="rollback-target" class="block text-sm font-medium">Reopen as</label>
						<select
							id="rollback-target"
							bind:value={targetStatus}
							class="app-input w-full px-3 py-2 text-sm"
						>
							<option value="pending">Pending (must start again)</option>
							<option value="in_progress">In progress (resume work)</option>
						</select>
					</div>
				{/if}
				{#if showAttachment}
					<div class="space-y-1">
						<label for="task-attachment" class="block text-sm font-medium"
							>Attachment (optional)</label
						>
						<input
							id="task-attachment"
							type="file"
							accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx"
							onchange={(e) => (file = e.currentTarget.files?.[0] ?? null)}
							class="block w-full text-sm"
						/>
						{#if file}
							<p class="text-xs text-(--app-muted)">
								Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)
							</p>
						{:else}
							<p class="text-xs text-(--app-muted)">PDF, images, or Office files up to 10 MB.</p>
						{/if}
					</div>
				{/if}
			{:else}
				<p class="text-sm">Mark this task as in progress?</p>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		<button type="button" class="btn btn-sm btn-outline" onclick={onClose} disabled={loading}
			>Cancel</button
		>
		<button
			type="button"
			class="btn btn-sm {mode === 'skip'
				? 'btn-warning'
				: mode === 'rollback'
					? 'btn-danger'
					: 'btn-primary'}"
			onclick={() => void submit()}
			disabled={loading}
		>
			{loading
				? 'Working…'
				: mode === 'complete'
					? 'Complete'
					: mode === 'skip'
						? 'Skip'
						: mode === 'rollback'
							? 'Reopen'
							: 'Start'}
		</button>
	{/snippet}
</Modal>
