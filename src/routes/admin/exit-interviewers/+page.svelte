<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import AdminGate from '$lib/components/AdminGate.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { InterviewerMapRow, UserSearchHit } from '$lib/types';

	let { data, form } = $props();

	let formOpen = $state(false);
	let mapId = $state<number | null>(null);
	let positionPattern = $state('');
	let interviewerUserId = $state<number | null>(null);
	let interviewerLabel = $state('');
	let isActive = $state(true);
	let searchQ = $state('');
	let searchHits = $state<UserSearchHit[]>([]);
	let error = $state<string | null>(null);
	let saving = $state(false);

	$effect(() => {
		if (form?.error) error = form.error;
		if (form?.ok) {
			formOpen = false;
			error = null;
		}
	});

	$effect(() => {
		if (!formOpen || searchQ.trim().length < 1) {
			searchHits = [];
			return;
		}
		const t = window.setTimeout(() => {
			void (async () => {
				try {
					const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQ.trim())}`, {
						cache: 'no-store'
					});
					if (!res.ok) {
						searchHits = [];
						return;
					}
					const payload = (await res.json()) as { users?: UserSearchHit[] };
					searchHits = payload.users ?? [];
				} catch {
					searchHits = [];
				}
			})();
		}, 250);
		return () => window.clearTimeout(t);
	});

	function openCreate() {
		mapId = null;
		positionPattern = '';
		interviewerUserId = null;
		interviewerLabel = '';
		isActive = true;
		searchQ = '';
		formOpen = true;
		error = null;
	}

	function openEdit(row: InterviewerMapRow) {
		mapId = row.mapId;
		positionPattern = row.positionPattern;
		interviewerUserId = row.interviewerUserId;
		interviewerLabel = `${row.interviewerDisplayName} (${row.interviewerUsername})`;
		isActive = row.isActive;
		searchQ = '';
		formOpen = true;
		error = null;
	}

	function toggleInactive(checked: boolean) {
		const url = new URL($page.url);
		if (checked) url.searchParams.set('includeInactive', '1');
		else url.searchParams.delete('includeInactive');
		void goto(url.pathname + url.search, { invalidateAll: true });
	}

	async function saveViaFetch() {
		if (!positionPattern.trim() || !interviewerUserId) {
			error = 'Pattern and interviewer are required.';
			return;
		}
		saving = true;
		error = null;
		try {
			const body =
				mapId == null
					? { positionPattern: positionPattern.trim(), interviewerUserId }
					: {
							positionPattern: positionPattern.trim(),
							interviewerUserId,
							isActive
						};
			const res = await fetch(
				mapId == null ? '/api/admin/exit-interviewers' : `/api/admin/exit-interviewers/${mapId}`,
				{
					method: mapId == null ? 'POST' : 'PUT',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(body)
				}
			);
			const payload = (await res.json()) as { error?: string | null };
			if (!res.ok) {
				error = payload.error || 'Save failed';
				return;
			}
			formOpen = false;
			await invalidateAll();
		} catch {
			error = 'Save failed';
		} finally {
			saving = false;
		}
	}
</script>

<AdminGate>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<label class="flex items-center gap-2 text-sm">
			<input
				type="checkbox"
				checked={data.includeInactive}
				onchange={(e) => toggleInactive(e.currentTarget.checked)}
				class="accent-(--focus-ring)"
			/>
			Show inactive
		</label>
		<button type="button" class="btn btn-sm btn-primary" onclick={openCreate}>Add mapping</button>
	</div>

	{#if error}
		<p class="text-sm text-(--form-error-text)">{error}</p>
	{/if}

	<div class="app-table-wrap">
		<table class="w-full min-w-[720px] border-collapse text-left text-sm">
			<thead class="bg-(--table-header-bg) text-(--table-header-text)">
				<tr>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
						>Position pattern</th
					>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
						>Interviewer</th
					>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Status</th>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Action</th>
				</tr>
			</thead>
			<tbody>
				{#each data.mappings as row}
					<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
						<td class="px-3 py-2 font-medium">{row.positionPattern}</td>
						<td class="px-3 py-2">
							<div>{row.interviewerDisplayName}</div>
							<div class="text-xs text-(--app-muted)">{row.interviewerUsername}</div>
						</td>
						<td class="px-3 py-2">{row.isActive ? 'Active' : 'Inactive'}</td>
						<td class="px-3 py-2">
							<div class="flex flex-wrap gap-1">
								<button type="button" class="btn btn-xs btn-outline" onclick={() => openEdit(row)}
									>Edit</button
								>
								{#if row.isActive}
									<form
										method="POST"
										action="?/deactivate"
										use:enhance={() =>
											async ({ update }) => {
												if (!confirm('Deactivate this interviewer mapping?')) return;
												await update();
											}}
									>
										<input type="hidden" name="mapId" value={row.mapId} />
										<button type="submit" class="btn btn-xs btn-outline">Deactivate</button>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-3 py-4 text-(--app-muted)">No mappings.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</AdminGate>

<Modal
	open={formOpen}
	title={mapId == null ? 'Add exit interviewer' : 'Edit exit interviewer'}
	onClose={() => (formOpen = false)}
>
	{#snippet children()}
		<div class="space-y-3">
			<label class="block text-sm">
				<span class="mb-1 block font-medium">Position pattern</span>
				<input class="app-input w-full px-3 py-2" bind:value={positionPattern} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium">Find interviewer</span>
				<input
					class="app-input w-full px-3 py-2"
					bind:value={searchQ}
					placeholder="Search user…"
				/>
			</label>
			{#if interviewerLabel}
				<p class="text-sm">Selected: <strong>{interviewerLabel}</strong></p>
			{/if}
			{#if searchHits.length}
				<ul class="app-panel max-h-40 divide-y divide-(--app-border) overflow-y-auto">
					{#each searchHits as hit}
						<li>
							<button
								type="button"
								class="w-full px-3 py-2 text-left text-sm hover:bg-(--app-surface-2)"
								onclick={() => {
									interviewerUserId = hit.userId;
									interviewerLabel = `${hit.displayName} (${hit.username})`;
									searchHits = [];
									searchQ = '';
								}}
							>
								<span class="font-medium">{hit.displayName}</span>
								<span class="mt-0.5 block text-xs text-(--app-muted)">{hit.username}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if mapId != null}
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={isActive} class="accent-(--focus-ring)" />
					Active
				</label>
			{/if}
		</div>
	{/snippet}
	{#snippet footer()}
		<button type="button" class="btn btn-sm btn-ghost" onclick={() => (formOpen = false)}
			>Cancel</button
		>
		<button
			type="button"
			class="btn btn-sm btn-primary"
			disabled={saving}
			onclick={() => void saveViaFetch()}>{saving ? 'Saving…' : 'Save'}</button
		>
	{/snippet}
</Modal>
