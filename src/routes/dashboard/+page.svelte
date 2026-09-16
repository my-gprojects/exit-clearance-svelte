<script lang="ts">
	import CaseStatusBadge from '$lib/components/CaseStatusBadge.svelte';
	import TaskActionModal from '$lib/components/TaskActionModal.svelte';
	import { progressWidthClass } from '$lib/roles';
	import type { QueueTask, TaskActionMode } from '$lib/types';

	let { data } = $props();

	let actionTask = $state<QueueTask | null>(null);
	let actionMode = $state<TaskActionMode>('complete');

	function openComplete(task: QueueTask) {
		actionTask = task;
		actionMode = 'complete';
	}
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-xl font-semibold text-(--app-text)">Dashboard</h1>
		<p class="text-sm text-(--app-muted)">Welcome, {data.user.displayName}.</p>
	</div>

	{#if data.manage}
		<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<a href="/cases" class="app-panel block p-4 hover:bg-(--table-row-hover-bg)">
				<div class="text-xs text-(--app-muted)">Open cases</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.openCases}</div>
			</a>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">LWD today</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.lwdToday}</div>
			</div>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">LWD at risk</div>
				<div class="mt-1 text-2xl font-semibold">{data.summary.lwdAtRisk}</div>
			</div>
			<div class="app-panel p-4">
				<div class="text-xs text-(--app-muted)">My queue</div>
				<div class="mt-1 text-2xl font-semibold">{data.queue.length}</div>
			</div>
		</section>
	{/if}

	{#if data.myCase}
		<article class="app-panel space-y-3 p-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-base font-semibold">My exit clearance</h2>
				<CaseStatusBadge status={data.myCase.status} />
			</div>
			<p class="text-sm text-(--app-muted)">
				{data.myCase.caseNumber} · Last working day {data.myCase.lastWorkingDay}
			</p>
			<div class="min-w-32 space-y-1">
				<div class="text-xs text-(--app-muted)">
					{data.myCase.tasksSummary.overall.completed}/{data.myCase.tasksSummary.overall.total}
				</div>
				<div class="h-2 w-full overflow-hidden rounded bg-(--app-surface-2)">
					<div
						class="h-full rounded bg-(--button-primary-bg) {progressWidthClass(
							data.myCase.tasksSummary.overall.completed,
							data.myCase.tasksSummary.overall.total
						)}"
						role="progressbar"
					></div>
				</div>
			</div>
			<p>
				<a
					href={`/cases/${data.myCase.exitCaseId}`}
					class="text-sm font-medium text-(--focus-ring) hover:underline"
				>
					View case details
				</a>
			</p>
		</article>
	{/if}

	<article class="app-panel p-4">
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-base font-semibold">My action queue</h2>
			{#if data.manage}
				<a href="/cases" class="text-sm font-medium text-(--focus-ring) hover:underline"
					>All cases</a
				>
			{/if}
		</div>

		{#if data.queue.length === 0}
			<p class="text-sm text-(--app-muted)">No pending tasks for your role.</p>
		{:else}
			<div class="app-table-wrap -mx-4 -mb-4 border-x-0 border-b-0">
				<table class="w-full min-w-[720px] border-collapse text-left text-sm">
					<thead class="bg-(--table-header-bg) text-(--table-header-text)">
						<tr>
							<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Case</th>
							<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
								>Employee</th
							>
							<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Task</th>
							<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
								>Status</th
							>
							<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Due</th>
							<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
								>Action</th
							>
						</tr>
					</thead>
					<tbody>
						{#each data.queue as task}
							<tr class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg)">
								<td class="px-3 py-2">
									<a
										href={`/cases/${task.exitCaseId}`}
										class="font-medium text-(--focus-ring) hover:underline"
										>{task.caseNumber}</a
									>
								</td>
								<td class="px-3 py-2">{task.employeeDisplayName}</td>
								<td class="px-3 py-2">{task.title}</td>
								<td class="px-3 py-2">
									<span
										class="app-chip border border-(--app-border) bg-(--app-surface-2) px-1.5 py-0.5 text-xs capitalize"
										>{task.status.replaceAll('_', ' ')}</span
									>
								</td>
								<td class="px-3 py-2 text-(--app-muted)">{task.dueAt?.slice(0, 10) ?? '—'}</td>
								<td class="px-3 py-2">
									<button
										type="button"
										class="btn btn-xs btn-primary"
										onclick={() => openComplete(task)}
									>
										Complete
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</article>
</div>

{#if actionTask}
	<TaskActionModal
		open={true}
		taskId={actionTask.taskId}
		taskTitle={actionTask.title}
		mode={actionMode}
		allowAttachments={actionTask.allowAttachments}
		onClose={() => (actionTask = null)}
	/>
{/if}
