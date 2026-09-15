<script lang="ts">
	import { enhance } from '$app/forms';
	import { ROLE_LABELS } from '$lib/roles';
	import type { RoleCode } from '$lib/types';

	let { data, form } = $props();

	let selectedId = $state<number | null>(null);
	let draftRoles = $state<RoleCode[]>([]);
	let query = $state('');

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

	const selected = $derived(data.users.find((u) => u.userId === selectedId) ?? null);

	function selectUser(userId: number) {
		selectedId = userId;
		const u = data.users.find((x) => x.userId === userId);
		draftRoles = u ? [...u.roles] : [];
	}

	function toggleRole(code: RoleCode, on: boolean) {
		if (on) {
			if (!draftRoles.includes(code)) draftRoles = [...draftRoles, code];
		} else {
			draftRoles = draftRoles.filter((r) => r !== code);
		}
	}
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-xl font-semibold text-(--app-text)">Admin · Users & roles</h1>
		<p class="text-sm text-(--app-muted)">
			Assign AD-style roles. Changes write back to <code class="rounded bg-(--app-surface-2) px-1"
				>users.json</code
			>.
		</p>
	</div>

	{#if form?.error}
		<p class="text-sm text-(--form-error-text)" role="alert">{form.error}</p>
	{:else if form?.ok}
		<p class="text-sm text-(--button-success-bg)" role="status">
			Roles saved for user #{form.userId}.
		</p>
	{/if}

	<div class="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
		<article class="app-panel space-y-3 p-4">
			<label class="flex min-w-[220px] flex-col gap-1 text-sm">
				<span class="text-(--app-muted)">Search users</span>
				<input
					class="app-input h-10 px-3 text-sm"
					placeholder="Search users…"
					bind:value={query}
				/>
			</label>

			<ul class="max-h-[60vh] space-y-2 overflow-auto">
				{#each filtered as u}
					<li>
						<button
							type="button"
							class="app-panel w-full cursor-pointer px-3 py-2 text-left transition-colors hover:bg-(--table-row-hover-bg) {selectedId ===
							u.userId
								? 'ring-2 ring-(--focus-ring)'
								: ''}"
							onclick={() => selectUser(u.userId)}
						>
							<div class="font-medium text-(--app-text)">{u.displayName}</div>
							<div class="text-xs text-(--app-muted)">{u.username} · {u.email}</div>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each u.roles as r}
									<span
										class="app-chip border border-(--app-border) bg-(--app-surface-2) px-1.5 py-0.5 text-xs"
										>{ROLE_LABELS[r as RoleCode] ?? r}</span
									>
								{:else}
									<span class="text-xs text-(--app-muted)">None</span>
								{/each}
							</div>
						</button>
					</li>
				{/each}
			</ul>
		</article>

		<article class="app-panel p-4">
			{#if !selected}
				<p class="text-sm text-(--app-muted)">Select a user to edit roles.</p>
			{:else}
				<h2 class="text-base font-semibold">{selected.displayName}</h2>
				<p class="text-sm text-(--app-muted)">
					{selected.username} · {selected.department ?? '—'}
				</p>

				<form method="POST" action="?/saveRoles" class="mt-4 space-y-4" use:enhance>
					<input type="hidden" name="userId" value={selected.userId} />
					<div class="grid gap-2 sm:grid-cols-2">
						{#each data.roleCodes as code}
							<label class="app-panel flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm">
								<input
									type="checkbox"
									name="roles"
									value={code}
									checked={draftRoles.includes(code)}
									onchange={(e) => toggleRole(code, e.currentTarget.checked)}
									class="accent-(--focus-ring)"
								/>
								{ROLE_LABELS[code]}
							</label>
						{/each}
					</div>
					<button class="btn btn-md btn-primary" type="submit">Save roles</button>
				</form>
			{/if}
		</article>
	</div>
</div>
