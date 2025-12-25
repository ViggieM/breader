<!-- ABOUTME: Expandable bookmark component for navigation menu with action buttons (notes, edit, share, open) -->
<!-- ABOUTME: Wraps in draggable <li> for drag-and-drop support, handles web share API with clipboard fallback -->

<script lang="ts">
	import { dragState } from '$lib/stores/dragState.svelte';

	interface Props {
		bookmark: {
			id: string;
			title?: string | null;
			faviconUrl: string;
			url: string;
		};
		class?: string;
	}

	let { bookmark, class: className }: Props = $props();
	let isOpen = $state(false);
	let shareSuccess = $state(false);
	let dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
	let containerElement = $state<HTMLLIElement>();

	function toggle(): void {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	$effect(() => {
		if (!isOpen) return;

		containerElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

		function handleClickOutside(event: MouseEvent) {
			if (containerElement && !containerElement.contains(event.target as Node)) {
				isOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		} else if (event.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}

	async function handleShare(): Promise<void> {
		try {
			if (navigator.share) {
				// Use Web Share API on mobile/supported browsers
				await navigator.share({
					title: bookmark.title || 'Untitled',
					url: bookmark.url
				});
			} else {
				// Fallback to clipboard on desktop
				await navigator.clipboard.writeText(bookmark.url);
				shareSuccess = true;
				setTimeout(() => {
					shareSuccess = false;
				}, 2000);
			}
		} catch (error) {
			// User canceled share or clipboard failed
			console.error('Share failed:', error);
		}
	}

	function handleOpen(): void {
		window.open(bookmark.url, '_blank', 'noopener,noreferrer');
	}

	function handleDragStart(event: DragEvent): void {
		// Set in dataTransfer (works on desktop)
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('application/x-bookmark-id', bookmark.id);
		}

		// ALSO set in global state (fallback for mobile)
		dragState.set('bookmark', bookmark.id);
	}

	function handleTouchStart(_event: TouchEvent): void {
		// Touch start handler for mobile drag-and-drop support
		// The actual drag state is set in handleDragStart
	}
</script>

<li
	bind:this={containerElement}
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={() => {
		dragState.clear();
	}}
	ontouchstart={handleTouchStart}
	aria-describedby="bookmark-drag-help"
	class={className}
>
	<div
		class={[
			'bookmark w-full grid auto-cols-fr grid-rows-[1fr_auto] gap-0',
			isOpen && 'shadow bookmark-open'
		]}
	>
		<button
			type="button"
			aria-haspopup="menu"
			aria-expanded={isOpen}
			aria-controls={dropdownId}
			aria-describedby="bookmark-actions-help"
			onclick={toggle}
			onkeydown={handleKeydown}
			class={['flex items-center gap-2 text-left min-w-0 min-h-0 cursor-pointer self-stretch']}
		>
			<img
				alt=""
				draggable="false"
				loading="lazy"
				class="w-4 h-4 shrink-0 self-start mt-0.5"
				src={bookmark.faviconUrl}
			/>
			<span
				class:truncate={!isOpen}
				class:text-pretty={isOpen}
				title={!isOpen ? bookmark.title?.trim() || 'Untitled' : undefined}
				>{bookmark.title?.trim() || 'Untitled'}</span
			>
		</button>

		{#if isOpen}
			<div
				id={dropdownId}
				role="menu"
				class="mt-2 w-full grid grid-cols-3 gap-2 text-base-content/70"
			>
				<a
					href="/bookmark/{bookmark.id}"
					role="menuitem"
					class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200 cursor-pointer min-w-0"
					draggable="false"
				>
					<span class="icon-[ri--book-open-line] size-4" aria-hidden="true"></span>
					<span class="text-xs">Read</span>
				</a>
				<button
					role="menuitem"
					class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200 cursor-pointer min-w-0"
					onclick={handleShare}
					draggable="false"
				>
					<span
						class={shareSuccess
							? 'icon-[ri--check-line] size-4'
							: 'icon-[ri--share-forward-line] size-4'}
						aria-hidden="true"
					></span>
					<span class="text-xs">Share</span>
				</button>
				<button
					role="menuitem"
					class="flex flex-col items-center justify-center gap-1 p-2 rounded hover:bg-base-200 cursor-pointer min-w-0"
					onclick={handleOpen}
					draggable="false"
				>
					<span class="icon-[ri--external-link-line] size-4" aria-hidden="true"></span>
					<span class="text-xs">Open</span>
				</button>
			</div>
		{/if}
	</div>
</li>

<style>
	.bookmark-open:active,
	.bookmark-open:hover {
		color: var(--color-content) !important;
		background-color: transparent !important;
	}
</style>
