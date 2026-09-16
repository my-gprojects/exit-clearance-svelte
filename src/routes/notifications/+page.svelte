<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	function formatWhen(iso: string) {
		if (!iso) return '';
		try {
			return new Intl.DateTimeFormat('en-GB', {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'Asia/Jakarta'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	function toggleUnread(checked: boolean) {
		const url = new URL($page.url);
		if (checked) url.searchParams.set('unreadOnly', '1');
		else url.searchParams.delete('unreadOnly');
		void goto(url.pathname + url.search, { invalidateAll: true });
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-xl font-semibold text-(--app-text)">Notifications</h1>
			<p class="text-sm text-(--app-muted)">
				In-app alerts for exit clearance events and SLA reminders.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<label class="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={data.unreadOnly}
					onchange={(e) => toggleUnread(e.currentTarget.checked)}
					class="accent-(--focus-ring)"
				/>
				Unread only
			</label>
			<form method="POST" action="?/markAllRead" use:enhance>
				<button type="submit" class="btn btn-sm btn-outline">Mark all read</button>
			</form>
		</div>
	</div>

	{#if data.notifications.length === 0}
		<p class="text-sm text-(--app-muted)">No notifications to show.</p>
	{:else}
		<ul class="app-panel divide-y divide-(--app-border)">
			{#each data.notifications as n}
				<li class="px-4 py-3 {n.isRead ? '' : 'bg-(--focus-ring)/5'}">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold">{n.title}</p>
							{#if n.body}
								<p class="mt-1 text-sm text-(--app-muted)">{n.body}</p>
							{/if}
							<p class="mt-2 text-xs text-(--app-muted)">
								{#if n.caseNumber && n.exitCaseId}
									<a
										href={`/cases/${n.exitCaseId}`}
										class="font-medium text-(--focus-ring) hover:underline">{n.caseNumber}</a
									>
									{' · '}
								{/if}
								{formatWhen(n.createdAt)}
								{' · '}
								<span class="capitalize">{n.eventType.replaceAll('_', ' ')}</span>
							</p>
						</div>
						{#if !n.isRead}
							<form method="POST" action="?/markRead" use:enhance>
								<input type="hidden" name="notificationId" value={n.notificationId} />
								<button type="submit" class="btn btn-xs btn-outline">Mark read</button>
							</form>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
