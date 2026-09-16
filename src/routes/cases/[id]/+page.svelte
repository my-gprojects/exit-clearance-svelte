<script lang="ts">
	import CaseStatusBadge from '$lib/components/CaseStatusBadge.svelte';
	import TaskActionModal from '$lib/components/TaskActionModal.svelte';
	import TaskAttachments from '$lib/components/TaskAttachments.svelte';
	import { canActOnTask, canRollbackTask, progressWidthClass, roleLabel } from '$lib/roles';
	import type { ExitTask, TaskActionMode } from '$lib/types';

	let { data } = $props();

	const pre = $derived(data.tasks.filter((t) => t.phase === 'pre_last_day'));
	const lwd = $derived(data.tasks.filter((t) => t.phase === 'last_working_day'));

	const caseMeta = $derived({
		employeeUserId: data.exitCase.employee.userId,
		performanceManagerUserId: data.exitCase.performanceManagerUserId,
		caseStatus: data.exitCase.status
	});

	let actionTask = $state<ExitTask | null>(null);
	let actionMode = $state<TaskActionMode>('complete');

	function openAction(task: ExitTask, mode: TaskActionMode) {
		actionTask = task;
		actionMode = mode;
	}
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
			{data.exitCase.employeeDisplayName} · {data.exitCase.positionTitle ?? '—'} ·
			{data.exitCase.department ?? '—'}
		</p>
	</div>

	<div class="app-panel grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
		<div>
			<div class="text-xs text-(--app-muted)">Last working day</div>
			<div class="font-semibold">{data.exitCase.lastWorkingDay}</div>
		</div>
		<div>
			<div class="text-xs text-(--app-muted)">Resignation</div>
			<div class="font-semibold">{data.exitCase.resignationDate ?? '—'}</div>
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
					<table class="w-full min-w-[720px] border-collapse text-left text-sm">
						<thead class="bg-(--table-header-bg) text-(--table-header-text)">
							<tr>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">#</th>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold">Task</th>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Owner</th
								>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Required</th
								>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Status</th
								>
								<th class="border-b border-(--table-header-border) px-3 py-2 font-semibold"
									>Action</th
								>
							</tr>
						</thead>
						<tbody>
							{#each section.tasks as task}
								{@const canAct = canActOnTask(data.user, task, caseMeta)}
								{@const canRollback = canRollbackTask(data.user, task, caseMeta)}
								{@const blocked = task.status === 'blocked'}
								<tr
									class="border-b border-(--table-row-border) hover:bg-(--table-row-hover-bg) {blocked
										? 'opacity-70'
										: ''}"
								>
									<td class="px-3 py-2 align-top text-(--app-muted)">{task.sortOrder}</td>
									<td class="px-3 py-2 align-top">
										<div class="font-medium">{task.title}</div>
										{#if task.notes}
											<p class="mt-1 whitespace-pre-wrap text-xs text-(--app-muted)">
												Note: {task.notes}
											</p>
										{/if}
										{#if task.allowAttachments}
											<TaskAttachments taskId={task.taskId} />
										{/if}
									</td>
									<td class="px-3 py-2 align-top text-(--app-muted)">{roleLabel(task.ownerRole)}</td>
									<td class="px-3 py-2 align-top">{task.isRequired ? 'Yes' : 'Optional'}</td>
									<td class="px-3 py-2 align-top capitalize">
										{task.status.replaceAll('_', ' ')}
										{#if blocked}
											<span class="mt-0.5 block text-xs text-(--app-muted)"
												>Waiting on dependencies</span
											>
										{/if}
									</td>
									<td class="px-3 py-2 align-top">
										{#if canAct}
											<div class="flex flex-wrap gap-1">
												{#if task.status === 'pending'}
													<button
														type="button"
														class="btn btn-xs btn-outline"
														onclick={() => openAction(task, 'start')}>Start</button
													>
												{/if}
												<button
													type="button"
													class="btn btn-xs btn-primary"
													onclick={() => openAction(task, 'complete')}>Complete</button
												>
												{#if !task.isRequired}
													<button
														type="button"
														class="btn btn-xs btn-warning"
														onclick={() => openAction(task, 'skip')}>Skip</button
													>
												{/if}
											</div>
										{:else if canRollback}
											<button
												type="button"
												class="btn btn-xs btn-outline"
												title="Admin: reopen this task"
												onclick={() => openAction(task, 'rollback')}>Reopen</button
											>
										{:else}
											<span class="text-xs text-(--app-muted)">—</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</article>
	{/each}
</div>

{#if actionTask}
	<TaskActionModal
		open={true}
		taskId={actionTask.taskId}
		taskTitle={actionTask.title}
		mode={actionMode}
		allowAttachments={actionTask.allowAttachments ?? false}
		onClose={() => (actionTask = null)}
	/>
{/if}
