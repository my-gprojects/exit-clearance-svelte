<script lang="ts">
	import CaseStatusBadge from '$lib/components/CaseStatusBadge.svelte';
	import { progressWidthClass, roleLabel } from '$lib/roles';

	let { data } = $props();

	const pre = $derived(data.tasks.filter((t) => t.phase === 'pre_last_day'));
	const lwd = $derived(data.tasks.filter((t) => t.phase === 'last_working_day'));
</script>

<div class="space-y-4">
	<div>
		<p class="text-sm text-(--app-muted)">
			<a href="/cases" class="hover:text-(--app-text) hover:underline">← Cases</a>
		</p>
		<div class="mt-1 flex flex-wrap items-center gap-3">
			<h1 class="text-xl font-semibold text-(--app-text)">{data.exitCase.caseNumber}</h1>
			<CaseStatusBadge status={data.exitCase.status} />
		</div>
		<p class="text-sm text-(--app-muted)">
			{data.exitCase.employeeDisplayName} · {data.exitCase.positionTitle} ·
			{data.exitCase.department}
		</p>
	</div>

	<div class="app-panel grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
		<div>
			<div class="text-xs text-(--app-muted)">Last working day</div>
			<div class="font-semibold">{data.exitCase.lastWorkingDay}</div>
		</div>
		<div>
			<div class="text-xs text-(--app-muted)">Resignation</div>
			<div class="font-semibold">{data.exitCase.resignationDate}</div>
		</div>
		<div>
			<div class="text-xs text-(--app-muted)">Progress</div>
			<div class="mt-1 min-w-32 space-y-1">
				<div class="text-xs text-(--app-muted)">
					{data.exitCase.tasksSummary.overall.completed}/{data.exitCase.tasksSummary.overall.total}
				</div>
				<div class="h-2 w-full overflow-hidden rounded bg-(--app-surface-2)">
					<div
						class="h-full rounded bg-(--button-primary-bg) {progressWidthClass(
							data.exitCase.tasksSummary.overall.completed,
							data.exitCase.tasksSummary.overall.total
						)}"
					></div>
				</div>
			</div>
		</div>
		<div>
			<div class="text-xs text-(--app-muted)">Email</div>
			<div class="font-semibold">{data.exitCase.employeeEmail}</div>
		</div>
	</div>

	{#each [{ title: 'Before last working day', tasks: pre }, { title: 'Last working day', tasks: lwd }] as section}
		<article class="app-panel p-4">
			<h2 class="mb-3 text-base font-semibold">{section.title}</h2>
			{#if section.tasks.length === 0}
				<p class="text-sm text-(--app-muted)">No tasks.</p>
			{:else}
				<div class="app-table-wrap -mx-4 -mb-4 border-x-0 border-b-0">
					<table class="w-full min-w-[560px] border-collapse text-left text-sm">
						<thead class="bg-(--table-header-bg) text-(--table-header-text)">
							<tr>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Task</th
								>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Owner</th
								>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Status</th
								>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Due</th
								>
							</tr>
						</thead>
						<tbody>
							{#each section.tasks as task}
								<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
									<td class="px-3 py-2">{task.title}</td>
									<td class="px-3 py-2 text-(--app-muted)">{roleLabel(task.ownerRole)}</td>
									<td class="px-3 py-2">
										<span
											class="app-chip border border-(--app-border) bg-(--app-surface-2) px-1.5 py-0.5 text-xs"
											>{task.status}</span
										>
									</td>
									<td class="px-3 py-2 text-(--app-muted)">{task.dueAt?.slice(0, 10) ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</article>
	{/each}
</div>
