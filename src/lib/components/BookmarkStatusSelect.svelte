<script lang="ts">
	import { BookmarkStatus } from '$lib/types';

	let {
		status = $bindable(),
		disabled = $bindable(),
		saving = $bindable(),
		handleClick,
		position = 'bottom',
		size = 'medium'
	} = $props();

	let hidden = $state(true);
	let containerElement: HTMLDivElement | undefined = $state();

	let buttonText = $derived.by(() => {
		if (saving) return 'Saving...';
		if (status === BookmarkStatus.WANT_TO_READ) return 'Want to read';
		if (status === BookmarkStatus.READ) return 'Read';
		if (status === BookmarkStatus.READING) return 'Currently reading';
		if (status === BookmarkStatus.ARCHIVED) return 'Archive';
	});

	// Handle click outside to close dropdown
	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerElement && !containerElement.contains(event.target as Node)) {
				hidden = true;
			}
		};

		if (!hidden) {
			document.addEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div bind:this={containerElement} class="relative w-full flex gap-0">
	<button
		{disabled}
		class="btn grow shadow-none"
		class:btn-warning={status === BookmarkStatus.WANT_TO_READ}
		class:btn-success={status === BookmarkStatus.READ}
		class:btn-info={status === BookmarkStatus.READING}
		class:btn-neutral={status === BookmarkStatus.ARCHIVED}
		class:btn-sm={size === 'small'}
		onclick={() => {
			status = BookmarkStatus.WANT_TO_READ;
			hidden = true;
			handleClick();
		}}
	>
		{buttonText}
	</button>
	<button
		aria-label="Select other Option"
		onclick={() => (hidden = !hidden)}
		class="btn rounded-l-none shadow-none peer absolute right-0"
		class:btn-warning={status === BookmarkStatus.WANT_TO_READ}
		class:btn-success={status === BookmarkStatus.READ}
		class:btn-info={status === BookmarkStatus.READING}
		class:btn-neutral={status === BookmarkStatus.ARCHIVED}
		class:btn-sm={size === 'small'}
	>
		<span class="icon-[ri--arrow-down-s-line]"></span>
	</button>
	<ul
		class={[
			'absolute w-full flex flex-col gap-2 z-1',
			position === 'top' && 'bottom-full origin-bottom mb-2 flex-col-reverse',
			position === 'bottom' && 'top-full mt-2'
		]}
		class:hidden
	>
		{#if status !== BookmarkStatus.WANT_TO_READ}
			<li>
				<button
					type="submit"
					{disabled}
					class="btn btn-warning w-full"
					class:btn-sm={size === 'small'}
					onclick={() => {
						status = BookmarkStatus.WANT_TO_READ;
						hidden = true;
						handleClick();
					}}
				>
					{saving ? 'Saving...' : 'Want to read'}
				</button>
			</li>
		{/if}

		{#if status !== BookmarkStatus.READ}
			<li>
				<button
					type="submit"
					{disabled}
					class="btn btn-success w-full"
					class:btn-sm={size === 'small'}
					onclick={() => {
						status = BookmarkStatus.READ;
						hidden = true;
						handleClick();
					}}
				>
					{saving ? 'Saving...' : 'Read'}
				</button>
			</li>
		{/if}

		{#if status !== BookmarkStatus.READING}
			<li>
				<button
					type="submit"
					{disabled}
					class="btn btn-info w-full"
					class:btn-sm={size === 'small'}
					onclick={() => {
						status = BookmarkStatus.READING;
						hidden = true;
						handleClick();
					}}
				>
					{saving ? 'Saving...' : 'Currently reading'}
				</button>
			</li>
		{/if}
		{#if status !== BookmarkStatus.ARCHIVED}
			<li>
				<button
					type="submit"
					{disabled}
					class="btn btn-neutral w-full"
					class:btn-sm={size === 'small'}
					onclick={() => {
						status = BookmarkStatus.ARCHIVED;
						hidden = true;
						handleClick();
					}}
				>
					{saving ? 'Saving...' : 'Archive'}
				</button>
			</li>
		{/if}
	</ul>
</div>
