<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ROLE_LABELS, statusLabel } from '$lib/roles';
	import type { RoleCode } from '$lib/types';

	let { data } = $props();

	const tabs = [
		{ id: 'pipeline', label: 'Case pipeline' },
		{ id: 'task-aging', label: 'Task aging' },
		{ id: 'sla', label: 'SLA compliance' },
		{ id: 'audit', label: 'Audit trail' }
	] as const;

	let filters = $state({
		dateFrom: '',
		dateTo: '',
		department: '',
		status: '',
		ownerRole: '',
		phase: '',
		yearMonth: '',
		caseNumber: ''
	});

	$effect(() => {
		filters = { ...data.filters };
	});

	const maxStatusCount = $derived(
		Math.max(1, ...(data.summary?.byStatus.map((s) => s.count) ?? [1]))
	);

	function applyFilters() {
		const url = new URL($page.url);
		url.searchParams.set('tab', data.tab);
		for (const [k, v] of Object.entries(filters)) {
			if (v) url.searchParams.set(k, v);
			else url.searchParams.delete(k);
		}
		void goto(url.pathname + url.search, { invalidateAll: true });
	}

	function switchTab(id: string) {
		const url = new URL($page.url);
		url.searchParams.set('tab', id);
		void goto(url.pathname + url.search, { invalidateAll: true });
	}

	function downloadCsv() {
		let rows: Record<string, unknown>[] = [];
		if (data.tab === 'pipeline') rows = data.pipeline as unknown as Record<string, unknown>[];
		else if (data.tab === 'task-aging') rows = data.aging as unknown as Record<string, unknown>[];
		else if (data.tab === 'sla') rows = data.sla as unknown as Record<string, unknown>[];
		else rows = data.audit as unknown as Record<string, unknown>[];

		if (!rows.length) return;
		const headers = Object.keys(rows[0]);
		const escape = (v: unknown) => {
			const s = v == null ? '' : String(v);
			if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
			return s;
		};
		const csv = [
			headers.join(','),
			...rows.map((r) => headers.map((h) => escape(r[h])).join(','))
		].join('\r\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `exit-clearance-${data.tab}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-xl font-semibold text-(--app-text)">Reports</h1>
			<p class="text-sm text-(--app-muted)">
				PPC pipeline, aging, SLA compliance, and audit export.
			</p>
		</div>
		<button type="button" class="btn btn-sm btn-outline" onclick={downloadCsv}>Export CSV</button>
	</div>

	{#if data.summary}
		<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">Open cases</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.openCases}</div>
			</div>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">LWD today</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.lwdToday}</div>
			</div>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">LWD at risk</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.lwdAtRisk}</div>
			</div>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">Overdue phase-1</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.overduePhase1Tasks}</div>
			</div>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">Cleared (7d)</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.clearedLast7Days}</div>
			</div>
		</section>

		{#if data.summary.byStatus.length}
			<article class="app-panel space-y-3 p-4">
				<h2 class="text-base font-semibold">Open cases by status</h2>
				{#each data.summary.byStatus as row}
					<div class="space-y-1">
						<div class="flex justify-between text-xs">
							<span>{statusLabel(row.status)}</span>
							<span class="text-(--app-muted)">{row.count}</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded bg-(--app-surface-2)">
							<div
								class="h-full rounded bg-(--button-primary-bg)"
								style={`width:${Math.round((row.count / maxStatusCount) * 100)}%`}
							></div>
						</div>
					</div>
				{/each}
			</article>
		{/if}
	{/if}

	<nav class="flex flex-wrap gap-2 border-b border-(--app-border) pb-2">
		{#each tabs as tab}
			<button
				type="button"
				class="px-3 py-1.5 text-sm transition-colors {data.tab === tab.id
					? 'border-b-2 border-(--focus-ring) font-semibold text-(--focus-ring)'
					: 'text-(--app-muted) hover:text-(--app-text)'}"
				onclick={() => switchTab(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<div class="app-panel flex flex-wrap items-end gap-2 p-3">
		{#if data.tab === 'pipeline' || data.tab === 'audit'}
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">From</span>
				<input type="date" class="app-input px-2 py-1.5" bind:value={filters.dateFrom} />
			</label>
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">To</span>
				<input type="date" class="app-input px-2 py-1.5" bind:value={filters.dateTo} />
			</label>
		{/if}
		{#if data.tab === 'pipeline'}
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">Department</span>
				<input class="app-input px-2 py-1.5" bind:value={filters.department} />
			</label>
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">Status</span>
				<input class="app-input px-2 py-1.5" bind:value={filters.status} placeholder="status code" />
			</label>
		{/if}
		{#if data.tab === 'task-aging'}
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">Owner role</span>
				<select class="app-input px-2 py-1.5" bind:value={filters.ownerRole}>
					<option value="">All</option>
					{#each data.roleCodes as code}
						<option value={code}>{ROLE_LABELS[code as RoleCode]}</option>
					{/each}
				</select>
			</label>
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">Phase</span>
				<select class="app-input px-2 py-1.5" bind:value={filters.phase}>
					<option value="">All</option>
					<option value="pre_last_day">Before last day</option>
					<option value="last_working_day">Last working day</option>
				</select>
			</label>
		{/if}
		{#if data.tab === 'sla'}
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">Month</span>
				<input type="month" class="app-input px-2 py-1.5" bind:value={filters.yearMonth} />
			</label>
		{/if}
		{#if data.tab === 'audit'}
			<label class="text-sm">
				<span class="mb-1 block text-(--app-muted)">Case #</span>
				<input class="app-input px-2 py-1.5" bind:value={filters.caseNumber} />
			</label>
		{/if}
		<button type="button" class="btn btn-sm btn-primary" onclick={applyFilters}>Apply</button>
	</div>

	{#if data.tab === 'pipeline'}
		<div class="app-table-wrap">
			<table class="w-full min-w-[720px] border-collapse text-left text-sm">
				<thead class="bg-(--table-header-bg) text-(--table-header-text)">
					<tr>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Case</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Employee</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Status</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Dept</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">LWD</th>
					</tr>
				</thead>
				<tbody>
					{#each data.pipeline as row}
						<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
							<td class="px-3 py-2">
								<a
									href={`/cases/${row.exitCaseId}`}
									class="font-medium text-(--focus-ring) hover:underline">{row.caseNumber}</a
								>
							</td>
							<td class="px-3 py-2">{row.employeeDisplayName}</td>
							<td class="px-3 py-2">{statusLabel(row.status)}</td>
							<td class="px-3 py-2 text-(--app-muted)">{row.department ?? '—'}</td>
							<td class="px-3 py-2">{row.lastWorkingDay}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="px-3 py-4 text-(--app-muted)">No rows.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if data.tab === 'task-aging'}
		<div class="app-table-wrap">
			<table class="w-full min-w-[720px] border-collapse text-left text-sm">
				<thead class="bg-(--table-header-bg) text-(--table-header-text)">
					<tr>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Case</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Task</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Owner</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Age (days)</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.aging as row}
						<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
							<td class="px-3 py-2">
								<a
									href={`/cases/${row.exitCaseId}`}
									class="font-medium text-(--focus-ring) hover:underline">{row.caseNumber}</a
								>
							</td>
							<td class="px-3 py-2">{row.title}</td>
							<td class="px-3 py-2">{ROLE_LABELS[row.ownerRole as RoleCode] ?? row.ownerRole}</td>
							<td class="px-3 py-2">{row.ageDays}</td>
							<td class="px-3 py-2 capitalize">{row.taskStatus.replaceAll('_', ' ')}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="px-3 py-4 text-(--app-muted)">No rows.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if data.tab === 'sla'}
		<div class="app-table-wrap">
			<table class="w-full min-w-[640px] border-collapse text-left text-sm">
				<thead class="bg-(--table-header-bg) text-(--table-header-text)">
					<tr>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Case</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Employee</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">LWD</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Outcome</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Met SLA</th>
					</tr>
				</thead>
				<tbody>
					{#each data.sla as row}
						<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
							<td class="px-3 py-2">
								<a
									href={`/cases/${row.exitCaseId}`}
									class="font-medium text-(--focus-ring) hover:underline">{row.caseNumber}</a
								>
							</td>
							<td class="px-3 py-2">{row.employeeDisplayName}</td>
							<td class="px-3 py-2">{row.lastWorkingDay}</td>
							<td class="px-3 py-2">{row.slaOutcome}</td>
							<td class="px-3 py-2">{row.metSla ? 'Yes' : 'No'}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="px-3 py-4 text-(--app-muted)">No rows.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="app-table-wrap">
			<table class="w-full min-w-[720px] border-collapse text-left text-sm">
				<thead class="bg-(--table-header-bg) text-(--table-header-text)">
					<tr>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">When</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Case</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Action</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Task</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Actor</th>
					</tr>
				</thead>
				<tbody>
					{#each data.audit as row}
						<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
							<td class="px-3 py-2 text-(--app-muted)"
								>{row.createdAt.slice(0, 19).replace('T', ' ')}</td
							>
							<td class="px-3 py-2">
								<a
									href={`/cases/${row.exitCaseId}`}
									class="font-medium text-(--focus-ring) hover:underline">{row.caseNumber}</a
								>
							</td>
							<td class="px-3 py-2">
								{row.action}
								{#if row.statusBefore || row.statusAfter}
									<span class="block text-xs text-(--app-muted)"
										>{row.statusBefore ?? '—'} → {row.statusAfter ?? '—'}</span
									>
								{/if}
							</td>
							<td class="px-3 py-2">{row.taskTitle ?? '—'}</td>
							<td class="px-3 py-2">{row.actorDisplayName ?? '—'}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="px-3 py-4 text-(--app-muted)">No rows.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
