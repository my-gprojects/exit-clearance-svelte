<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import AdminGate from '$lib/components/AdminGate.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { ROLE_LABELS } from '$lib/roles';
	import type { PublicUser, RoleCode, UserSearchHit } from '$lib/types';

	let { data, form } = $props();

	let query = $state('');
	let editUser = $state<(PublicUser & { isActive: boolean }) | null>(null);
	let draftRoles = $state<RoleCode[]>([]);
	let saving = $state(false);

	let assignOpen = $state(false);
	let assignQuery = $state('');
	let assignHits = $state<UserSearchHit[]>([]);
	let assignTarget = $state<UserSearchHit | null>(null);
	let assignRoles = $state<RoleCode[]>(['employee']);
	let assignSearching = $state(false);
	let error = $state<string | null>(null);

	const filtered = $derived(
		data.users.filter((u) => {
			const q = query.trim().toLowerCase();
			if (!q) return true;
			return (
				u.username.toLowerCase().includes(q) ||
				u.displayName.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q)
			);
		})
	);

	function openEdit(u: PublicUser & { isActive: boolean }) {
		editUser = u;
		draftRoles = [...u.roles];
		error = null;
	}

	function toggleRole(code: RoleCode, list: RoleCode[], setter: (v: RoleCode[]) => void) {
		setter(list.includes(code) ? list.filter((r) => r !== code) : [...list, code]);
	}

	async function saveRoles(userId: number, roles: RoleCode[], onDone: () => void) {
		saving = true;
		error = null;
		try {
			const res = await fetch(`/api/users/${userId}/roles`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ roles })
			});
			const payload = (await res.json()) as { error?: string | null };
			if (!res.ok) {
				error = payload.error || 'Failed to save roles';
				return;
			}
			onDone();
			await invalidateAll();
		} catch {
			error = 'Failed to save roles';
		} finally {
			saving = false;
		}
	}

	async function searchAssignUsers() {
		const q = assignQuery.trim();
		if (!q) {
			assignHits = [];
			return;
		}
		assignSearching = true;
		try {
			const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
				cache: 'no-store'
			});
			const payload = (await res.json()) as {
				users?: UserSearchHit[];
				error?: string | null;
			};
			if (!res.ok) {
				error = payload.error || 'Search failed';
				assignHits = [];
				return;
			}
			assignHits = payload.users ?? [];
		} catch {
			error = 'Search failed';
			assignHits = [];
		} finally {
			assignSearching = false;
		}
	}

	function openAssign() {
		assignOpen = true;
		assignQuery = '';
		assignHits = [];
		assignTarget = null;
		assignRoles = ['employee'];
		error = null;
	}

	function selectAssignTarget(hit: UserSearchHit) {
		assignTarget = hit;
		const existing = data.users.find((u) => u.userId === hit.userId);
		assignRoles = existing?.roles?.length ? [...existing.roles] : ['employee'];
	}
</script>

<AdminGate>
	<div class="flex flex-wrap items-end justify-between gap-2">
		<label class="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
			<span class="text-(--app-muted)">Search users</span>
			<input
				class="app-input h-10 px-3 text-sm"
				placeholder="Username, name, or email"
				bind:value={query}
			/>
		</label>
		<button type="button" class="btn btn-sm btn-outline" onclick={openAssign}>Assign roles</button>
	</div>

	<p class="text-sm text-(--app-muted)">
		Use <strong>Edit roles</strong> on a row, or <strong>Assign roles</strong> to search a user and
		set their role(s).
	</p>

	{#if error || form?.error}
		<p class="text-sm text-(--form-error-text)" role="alert">{error || form?.error}</p>
	{/if}

	<div class="app-table-wrap">
		<table class="w-full min-w-[720px] border-collapse text-left text-sm">
			<thead class="bg-(--table-header-bg) text-(--table-header-text)">
				<tr>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">User</th>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
						>Department</th
					>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Roles</th>
					<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Action</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as u}
					<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
						<td class="px-3 py-2">
							<div class="font-medium text-(--app-text)">{u.displayName}</div>
							<div class="text-xs text-(--app-muted)">{u.username} · {u.email}</div>
						</td>
						<td class="px-3 py-2 text-(--app-muted)">{u.department || '—'}</td>
						<td class="px-3 py-2">
							<div class="flex flex-wrap gap-1">
								{#each u.roles as r}
									<span
										class="app-chip border border-(--app-border) bg-(--app-surface-2) px-1.5 py-0.5 text-xs"
										>{ROLE_LABELS[r as RoleCode] ?? r}</span
									>
								{:else}
									<span class="text-(--app-muted)">None</span>
								{/each}
							</div>
						</td>
						<td class="px-3 py-2">
							<button type="button" class="btn btn-xs btn-outline" onclick={() => openEdit(u)}
								>Edit roles</button
							>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-3 py-4 text-sm text-(--app-muted)">No users found.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<form method="POST" action="?/saveRoles" class="hidden" use:enhance></form>
</AdminGate>

<Modal
	open={Boolean(editUser)}
	title={editUser ? `Roles — ${editUser.displayName}` : 'Roles'}
	onClose={() => (editUser = null)}
>
	{#snippet children()}
		<p class="mb-3 text-sm text-(--app-muted)">
			{editUser?.username} · select one or more roles
		</p>
		<div class="grid gap-2 sm:grid-cols-2">
			{#each data.roleCodes as code}
				<label class="app-panel flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm">
					<input
						type="checkbox"
						checked={draftRoles.includes(code)}
						onchange={() =>
							toggleRole(code, draftRoles, (v) => {
								draftRoles = v;
							})}
						class="accent-(--focus-ring)"
					/>
					{ROLE_LABELS[code]}
				</label>
			{/each}
		</div>
	{/snippet}
	{#snippet footer()}
		<button type="button" class="btn btn-sm btn-ghost" onclick={() => (editUser = null)}
			>Cancel</button
		>
		<button
			type="button"
			class="btn btn-sm btn-primary"
			disabled={saving || !editUser}
			onclick={() => {
				if (!editUser) return;
				void saveRoles(editUser.userId, draftRoles, () => (editUser = null));
			}}
		>
			{saving ? 'Saving…' : 'Save'}
		</button>
	{/snippet}
</Modal>

<Modal open={assignOpen} title="Assign roles to user" onClose={() => (assignOpen = false)}>
	{#snippet children()}
		<div class="space-y-4">
			<div class="flex flex-wrap items-end gap-2">
				<label class="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
					<span class="text-(--app-muted)">Find user</span>
					<input
						bind:value={assignQuery}
						onkeydown={(e) => {
							if (e.key === 'Enter') void searchAssignUsers();
						}}
						placeholder="Type name or username"
						class="app-input px-3 py-2"
					/>
				</label>
				<button
					type="button"
					class="btn btn-sm btn-outline"
					disabled={assignSearching}
					onclick={() => void searchAssignUsers()}
				>
					{assignSearching ? 'Searching…' : 'Search'}
				</button>
			</div>

			{#if assignTarget}
				<p class="text-sm">
					Selected: <strong>{assignTarget.displayName}</strong>
					<span class="text-(--app-muted)">({assignTarget.username})</span>
				</p>
			{/if}

			{#if assignHits.length > 0}
				<ul class="app-panel max-h-40 divide-y divide-(--app-border) overflow-y-auto">
					{#each assignHits as hit}
						<li>
							<button
								type="button"
								class="w-full px-3 py-2 text-left text-sm hover:bg-(--app-surface-2) {assignTarget?.userId ===
								hit.userId
									? 'bg-(--app-surface-2)'
									: ''}"
								onclick={() => selectAssignTarget(hit)}
							>
								<span class="font-medium">{hit.displayName}</span>
								<span class="mt-0.5 block text-xs text-(--app-muted)">
									{hit.username}{hit.department ? ` · ${hit.department}` : ''}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="grid gap-2 sm:grid-cols-2">
				{#each data.roleCodes as code}
					<label class="app-panel flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm">
						<input
							type="checkbox"
							checked={assignRoles.includes(code)}
							onchange={() =>
								toggleRole(code, assignRoles, (v) => {
									assignRoles = v;
								})}
							class="accent-(--focus-ring)"
						/>
						{ROLE_LABELS[code]}
					</label>
				{/each}
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<button type="button" class="btn btn-sm btn-ghost" onclick={() => (assignOpen = false)}
			>Cancel</button
		>
		<button
			type="button"
			class="btn btn-sm btn-primary"
			disabled={saving || !assignTarget || assignRoles.length === 0}
			onclick={() => {
				if (!assignTarget) return;
				void saveRoles(assignTarget.userId, assignRoles, () => (assignOpen = false));
			}}
		>
			{saving ? 'Saving…' : 'Save roles'}
		</button>
	{/snippet}
</Modal>
