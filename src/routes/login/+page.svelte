<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<main class="flex min-h-screen items-center justify-center bg-(--background) px-4">
	<form method="POST" class="app-panel w-full max-w-md space-y-5 p-8 shadow-sm" use:enhance>
		<div class="space-y-1">
			<h1 class="text-xl font-semibold text-(--app-text)">Exit Clearance</h1>
			<p class="text-sm text-(--app-muted)">
				Sign in with your AD laptop username and password.
			</p>
		</div>

		{#if form?.error}
			<p class="text-sm text-(--form-error-text)" role="alert">{form.error}</p>
		{/if}

		<div class="space-y-1.5">
			<label for="username" class="block text-sm font-medium text-(--app-text)">Username</label>
			<input
				id="username"
				name="username"
				autocomplete="username"
				value={form?.username ?? ''}
				required
				maxlength={64}
				placeholder="e.g. john.doe"
				class="h-10 w-full rounded-md border border-(--form-input-border) bg-(--form-input-bg) px-3 text-sm text-(--form-input-text) placeholder:text-(--form-input-placeholder) focus-visible:border-(--form-input-focus-border) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="password" class="block text-sm font-medium text-(--app-text)">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				maxlength={256}
				class="h-10 w-full rounded-md border border-(--form-input-border) bg-(--form-input-bg) px-3 text-sm text-(--form-input-text) focus-visible:border-(--form-input-focus-border) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
			/>
		</div>

		<button type="submit" class="btn btn-md btn-primary w-full">Sign in</button>

		<p class="text-xs text-(--app-muted)">
			Demo: <code class="rounded bg-(--app-surface-2) px-1">john.doe</code> /
			<code class="rounded bg-(--app-surface-2) px-1">admin.ec</code> —
			<code class="rounded bg-(--app-surface-2) px-1">DevPassword123!</code>
		</p>
	</form>
</main>
