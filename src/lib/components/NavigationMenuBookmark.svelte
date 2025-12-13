<script lang="ts">
	let { children } = $props();
	let isOpen = $state(false);
	let dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

	function toggle() {
		isOpen = !isOpen;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		} else if (event.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<div class={['bookmark grid grid-rows-[1fr_auto] gap-0', isOpen && 'shadow bookmark-open']}>
	<button
		type="button"
		aria-haspopup="menu"
		aria-expanded={isOpen}
		aria-controls={dropdownId}
		onclick={toggle}
		onkeydown={handleKeydown}
		class={['flex items-center gap-2 text-left min-w-0 min-h-0 cursor-pointer']}
	>
		<img
			alt=""
			draggable="false"
			loading="lazy"
			class="w-4 h-4 shrink-0 self-start mt-0.5"
			src="https://www.google.com/s2/favicons?domain=developer.chrome.com"
		/>
		<span class:truncate={!isOpen} class:text-pretty={isOpen}>{@render children()}</span>
	</button>

	{#if isOpen}
		<div
			id={dropdownId}
			role="menu"
			class="mt-2 grid grid-cols-4 gap-2 text-xs text-base-content/70"
		>
			<button
				role="menuitem"
				class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200 cursor-pointer"
			>
				<span class="icon-[ri--sticky-note-line] size-4" aria-hidden="true"></span>
				Notes
			</button>
			<button
				role="menuitem"
				class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200"
			>
				<span class="icon-[ri--edit-2-line] size-4" aria-hidden="true"></span>
				Edit
			</button>
			<button
				role="menuitem"
				class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200"
			>
				<span class="icon-[ri--share-forward-line] size-4" aria-hidden="true"></span>
				Share
			</button>
			<button
				role="menuitem"
				class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200"
			>
				<span class="icon-[ri--external-link-line] size-4" aria-hidden="true"></span>
				Open
			</button>
		</div>
	{/if}
</div>

<style>
	.bookmark-open:active,
	.bookmark-open:hover {
		color: var(--color-content) !important;
		background-color: transparent !important;
	}
</style>
