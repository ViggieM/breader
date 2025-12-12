<!-- ABOUTME: Main navigation menu component that displays favorites, archive, notes, untagged bookmarks, -->
<!-- ABOUTME: and hierarchical tag structure with collapsible sections and nested bookmarks -->

<script lang="ts">
	import { navigationData } from '$lib/stores/navigation.svelte';
	import NavigationMenuItem from './NavigationMenuItem.svelte';
	import { updateTagParent } from '$lib/db/tags';

	const dragHelpId = 'bookmark-drag-help';
	let currentlyDragedOver = $state<HTMLElement>();
	let isRootDropTarget = $state(false);
</script>

{#if $navigationData}
	<span id={dragHelpId} class="sr-only">Drag bookmarks to tags to add that tag</span>
	<span id="tag-drag-help" class="sr-only">
		Drag tags to reorganize the hierarchy. Drop on another tag to make it a child, or drop in the
		space above the tags to make it a root-level tag.
	</span>
	<ul
		class="menu rounded-box w-full p-0 mt-4"
		ondragover={(e) => {
			e.preventDefault();
			if (!e.dataTransfer) return;

			// Only accept tag drops at root level
			if (!e.dataTransfer.types.includes('application/x-tag-id')) {
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			e.dataTransfer.dropEffect = 'move';
			isRootDropTarget = true;
		}}
		ondragleave={() => {
			isRootDropTarget = false;
		}}
		ondrop={async (e) => {
			e.preventDefault();
			isRootDropTarget = false;

			if (!e.dataTransfer) return;

			// Only handle tag drops
			if (!e.dataTransfer.types.includes('application/x-tag-id')) return;

			const tagId = e.dataTransfer.getData('application/x-tag-id');
			if (!tagId) {
				console.error('No tag ID found in drag data');
				return;
			}

			try {
				await updateTagParent(tagId, null);
			} catch (error) {
				console.error('Failed to move tag to root:', error);
			}
		}}
	>
		<!-- Static top-level links -->
		<li>
			<a href="/list/favorites" aria-label="View favorite bookmarks">
				<span class="icon-[ri--star-line] shrink-0" aria-hidden="true"></span>
				Favorites
			</a>
		</li>
		<li>
			<a href="/list/archived" aria-label="View archived bookmarks">
				<span class="icon-[ri--archive-2-line] shrink-0" aria-hidden="true"></span>
				Archive
			</a>
		</li>
		<li>
			<a href="/list/notes" aria-label="View notes">
				<span class="icon-[ri--sticky-note-line] shrink-0" aria-hidden="true"></span>
				Notes
			</a>
		</li>

		<div
			role="region"
			aria-label="Tag organization area"
			class="border-t border-base-300 py-4 mt-4"
			class:bg-base-200={isRootDropTarget}
		>
			<!-- Untagged bookmarks section -->
			{#each $navigationData.untagged as bookmark (bookmark.id)}
				<li>
					<a
						draggable="true"
						href="/bookmark/{bookmark.id}"
						aria-label="Open {bookmark.title || 'Untitled'}"
						aria-describedby={dragHelpId}
						ondragstart={(e) => {
							if (!e.dataTransfer) return;
							e.dataTransfer.effectAllowed = 'move';
							e.dataTransfer.setData('application/x-bookmark-id', bookmark.id);
						}}
					>
						<img
							src={bookmark.faviconUrl}
							alt=""
							draggable="false"
							loading="lazy"
							class="w-4 h-4 shrink-0"
							onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
						<span class="truncate">{bookmark.title || 'Untitled'}</span>
					</a>
				</li>
			{/each}

			<!-- Tag tree with nested tags and bookmarks -->
			{#each $navigationData.tagTree as tagNode (tagNode.tag.id)}
				<NavigationMenuItem node={tagNode} />
			{/each}
		</div>

		<!-- Empty state -->
		{#if $navigationData.tagTree.length === 0 && $navigationData.untagged.length === 0}
			<li class="text-center py-4 text-base-content/60">
				<p>No bookmarks yet</p>
			</li>
		{/if}
	</ul>
	<div class="px-3">
		<button class="btn btn-sm btn-outline"
			><span class="icon-[ri--add-large-fill]"></span> Add a new tag</button
		>
	</div>
{:else}
	<!-- Loading state -->
	<div class="flex justify-center items-center p-8">
		<span class="loading loading-spinner loading-lg"></span>
	</div>
{/if}

<svelte:window
	ondrag={(e) => {
		const el = document.elementFromPoint(e.clientX, e.clientY);

		// Check if dragging over a tag details element
		let node: HTMLElement | null | undefined = el?.closest('details');
		if (node && [...node.classList].includes('dragover')) return;

		if (node) {
			currentlyDragedOver?.classList.remove('dragover');
			currentlyDragedOver = node;
			currentlyDragedOver.classList.add('dragover');
			return;
		}

		// Check if dragging over root drop area
		const rootArea = el?.closest('.border-t.border-base-300');
		if (rootArea && rootArea.classList.contains('dragover')) return;

		currentlyDragedOver?.classList.remove('dragover');
	}}
	ondragend={() => {
		document.querySelector('.dragover')?.classList.remove('dragover');
		isRootDropTarget = false;
	}}
/>
