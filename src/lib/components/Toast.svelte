<script lang="ts">
	import type { ToastType } from '$lib/stores/notifications.svelte';

	interface Props {
		id: string;
		type: ToastType;
		message: string;
		dismissible?: boolean;
		isClosing?: boolean;
		onclose?: (id: string) => void;
		onpause?: (id: string) => void;
		onresume?: (id: string) => void;
	}

	let {
		id,
		type,
		message,
		dismissible = true,
		isClosing = false,
		onclose,
		onpause,
		onresume
	}: Props = $props();
</script>

<div
	class={`max-w-120 alert alert-${type} ${isClosing ? 'toast--closing' : ''}`}
	onmouseenter={() => onpause?.(id)}
	onmouseleave={() => onresume?.(id)}
	role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
	aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
>
	<div class="flex items-center justify-center gap-2">
		<!-- Icon -->
		{#if type === 'success'}<span class="icon-[ri--checkbox-circle-fill] size-5 shrink-0"
			></span>{/if}
		{#if type === 'error'}<span class="icon-[ri--error-warning-fill] size-5 shrink-0"></span>{/if}
		{#if type === 'warning'}<span class="icon-[ri--error-warning-fill] size-5 shrink-0"></span>{/if}
		{#if type === 'info'}<span class="icon-[ri--information-2-fill] size-5 shrink-0"></span>{/if}

		<!-- Message -->
		<div>{message}</div>
	</div>

	<!-- Close button -->
	{#if dismissible}
		<button
			class="cursor-pointer rounded-full p-2 size-8"
			onclick={() => onclose?.(id)}
			aria-label="Dismiss notification"
		>
			<span class="icon-[ri--close-fill] size-4"></span>
		</button>
	{/if}
</div>
