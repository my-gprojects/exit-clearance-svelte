<script lang="ts">
	import AdminGate from '$lib/components/AdminGate.svelte';
	import { ROLE_LABELS } from '$lib/roles';
	import type { RoleCode, TaskTemplateAdmin } from '$lib/types';

	let { data, form } = $props();

	let templates = $state<TaskTemplateAdmin[]>([]);
	let savingId = $state<number | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		templates = [...data.templates];
	});

	$effect(() => {
		if (form?.error) error = form.error;
	});

	async function toggle(t: TaskTemplateAdmin, next: boolean) {
		savingId = t.taskTemplateId;
		error = null;
		try {
			const res = await fetch(`/api/admin/task-templates/${t.taskTemplateId}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ allowAttachments: next })
			});
			const payload = (await res.json()) as { error?: string | null };
			if (!res.ok) {
				error = payload.error || 'Update failed';
				return;
			}
			templates = templates.map((row) =>
				row.taskTemplateId === t.taskTemplateId ? { ...row, allowAttachments: next } : row
			);
		} catch {
			error = 'Update failed';
		} finally {
			savingId = null;
		}
	}
</script>

<AdminGate>
	<p class="text-sm text-(--app-muted)">
		Enable optional file attachments per task type. Changes apply to all open cases for that task
		code.
	</p>
	{#if error}
		<p class="text-sm text-(--form-error-text)">{error}</p>
	{/if}

	<div class="app-table-wrap">
		<table class="w-full min-w-[720px] border-collapse text-left text-sm">
			<thead class="bg-(--table-header-bg) text-(--table-header-text)">
				<tr>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Phase</th>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Task</th>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Owner</th>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
						>Allow attachments</th
					>
				</tr>
			</thead>
			<tbody>
				{#each templates as t}
					<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
						<td class="px-3 py-2 capitalize text-(--app-muted)">
							{t.phase.replaceAll('_', ' ')}
						</td>
						<td class="px-3 py-2">
							<div class="font-medium">{t.title}</div>
							<div class="text-xs text-(--app-muted)">{t.taskCode}</div>
						</td>
						<td class="px-3 py-2">{ROLE_LABELS[t.ownerRole as RoleCode] ?? t.ownerRole}</td>
						<td class="px-3 py-2">
							<label class="inline-flex items-center gap-2">
								<input
									type="checkbox"
									checked={t.allowAttachments}
									disabled={savingId === t.taskTemplateId || !t.isActive}
									onchange={(e) => void toggle(t, e.currentTarget.checked)}
									class="accent-(--focus-ring)"
								/>
								<span class="text-xs text-(--app-muted)"
									>{t.allowAttachments ? 'Enabled' : 'Disabled'}</span
								>
							</label>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-3 py-4 text-(--app-muted)">No templates.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</AdminGate>
