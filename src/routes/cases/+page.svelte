<script lang="ts">
	import CaseStatusBadge from '$lib/components/CaseStatusBadge.svelte';
	import { progressWidthClass } from '$lib/roles';

	let { data } = $props();
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-xl font-semibold text-(--app-text)">Cases</h1>
		<p class="text-sm text-(--app-muted)">
			{data.canManage ? 'All exit clearance cases (JSON store).' : 'Your exit cases.'}
		</p>
	</div>

	{#if data.cases.length === 0}
		<div class="app-panel px-3 py-4 text-sm text-(--app-muted)">No cases found.</div>
	{:else}
		<div class="app-table-wrap">
			<table class="w-full min-w-[720px] border-collapse text-left text-sm">
				<thead class="bg-(--table-header-bg) text-(--table-header-text)">
					<tr>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Case</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
							>Employee</th
						>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
							>Department</th
						>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">LWD</th>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
							>Status</th
						>
						<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
							>Progress</th
						>
					</tr>
				</thead>
				<tbody>
					{#each data.cases as c}
						<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
							<td class="px-3 py-2">
								<a
									href={`/cases/${c.exitCaseId}`}
									class="font-medium text-(--focus-ring) hover:underline">{c.caseNumber}</a
								>
							</td>
							<td class="px-3 py-2">{c.employeeDisplayName}</td>
							<td class="px-3 py-2 text-(--app-muted)">{c.department}</td>
							<td class="px-3 py-2">{c.lastWorkingDay}</td>
							<td class="px-3 py-2"><CaseStatusBadge status={c.status} /></td>
							<td class="px-3 py-2">
								<div class="min-w-32 space-y-1">
									<div class="text-xs text-(--app-muted)">
										{c.tasksSummary.overall.completed}/{c.tasksSummary.overall.total}
									</div>
									<div class="h-2 w-full overflow-hidden rounded bg-(--app-surface-2)">
										<div
											class="h-full rounded bg-(--button-primary-bg) {progressWidthClass(
												c.tasksSummary.overall.completed,
												c.tasksSummary.overall.total
											)}"
										></div>
									</div>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
