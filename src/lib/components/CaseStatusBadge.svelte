<script lang="ts">
	import { statusBadgeClass, statusLabel } from '$lib/roles';

	let { status }: { status: string } = $props();
</script>

<span
	class="inline-flex rounded-md px-2 py-0.5 text-xs font-medium {statusBadgeClass(status)}"
>
	{statusLabel(status)}
</span>
