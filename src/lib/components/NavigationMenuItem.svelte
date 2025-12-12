<!-- ABOUTME: Recursive tag menu item component that renders a tag with its bookmarks and child tags -->
<!-- ABOUTME: Uses self-imports for recursive rendering of nested tag structures with depth limiting -->

<script lang="ts">
	import type { TagNode } from '$lib/stores/navigation.svelte';
	import { onMount } from 'svelte';
	import NavigationMenuItem from './NavigationMenuItem.svelte';
	import { db } from '$lib/db';
	import { updateBookmarkTags } from '$lib/db/bookmarks';
	import { descendantMap, ancestorMap } from '$lib/stores/tags.svelte';

	interface Props {
		node: TagNode;
		level?: number;
	}

	let { node, level = 0 }: Props = $props();

	// Calculate total bookmark count (direct + descendants)
	function getTotalBookmarkCount(n: TagNode): number {
		let count = n.bookmarks.length;
		n.children.forEach((child) => {
			count += getTotalBookmarkCount(child);
		});
		return count;
	}

	const totalCount = getTotalBookmarkCount(node);

	// Persistent expand/collapse state
	const storageKey = `navigation-expanded-${node.tag.id}`;
	let isOpen = $state(false);
	let detailsElement = $state<HTMLDetailsElement>();

	const dragHelpId = 'bookmark-drag-help';

	onMount(() => {
		// Load saved state from localStorage
		const saved = localStorage.getItem(storageKey);
		if (saved !== null) {
			isOpen = saved === 'true';
		}
	});

	function handleToggle() {
		if (detailsElement) {
			isOpen = detailsElement.open;
			localStorage.setItem(storageKey, String(isOpen));
		}
	}
</script>

{#if level < 5}
	<li>
		<details
			id={node.tag.id}
			bind:this={detailsElement}
			open={isOpen}
			ontoggle={handleToggle}
			ondragover={(e) => {
				e.preventDefault();
				if (!e.dataTransfer) return;
				// Only allow bookmark drops
				if (!e.dataTransfer.types.includes('application/x-bookmark-id')) {
					e.dataTransfer.dropEffect = 'none';
					return;
				}
				e.stopPropagation();
				e.dataTransfer.dropEffect = 'move';
			}}
			ondragenter={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			ondragleave={(e) => {
				e.stopPropagation();
			}}
			ondrop={async (e) => {
				e.preventDefault();
				e.stopPropagation();

				if (!e.dataTransfer) return;

				// Validate data type
				if (!e.dataTransfer.types.includes('application/x-bookmark-id')) return;

				// Extract bookmark ID from data transfer
				const bookmarkId = e.dataTransfer.getData('application/x-bookmark-id');
				if (!bookmarkId) {
					console.error('No bookmark ID found in drag data');
					return;
				}

				try {
					// Get current bookmark
					const bookmark = await db.bookmarks.get(bookmarkId);
					if (!bookmark) {
						console.error('Bookmark not found:', bookmarkId);
						return;
					}

					// Check if tag exists
					if (!node.tag || !node.tag.id) {
						console.error('Invalid tag node:', node);
						return;
					}

					// Check if tag already exists in bookmark's tags
					if (!bookmark.tags.includes(node.tag.id)) {
						let newTags: string[] = [node.tag.id];
						$descendantMap.get(node.tag.id)?.forEach((id) => {
							newTags = newTags.filter((tagId) => tagId !== id);
						});
						$ancestorMap.get(node.tag.id)?.forEach((id) => {
							newTags = newTags.filter((tagId) => tagId !== id);
						});
						// Add the new tag to the existing tags
						await updateBookmarkTags(bookmarkId, newTags);
					}
				} catch (error) {
					console.error('Failed to update bookmark tags:', error);
				}
			}}
		>
			<summary
				class="font-normal"
				aria-label="{node.tag.name} tag ({totalCount} {totalCount === 1
					? 'bookmark'
					: 'bookmarks'}) - drop bookmarks here to add this tag"
			>
				<span class="icon-[ri--price-tag-3-fill] shrink-0" aria-hidden="true"></span>
				<span class="flex-1 truncate" title={node.tag.name}>{node.tag.name}</span>
			</summary>
			<ul>
				<!-- Child tags (recursive) -->
				{#each node.children as childNode (childNode.tag.id)}
					<NavigationMenuItem node={childNode} level={level + 1} />
				{/each}

				<!-- Direct bookmarks for this tag -->
				{#each node.bookmarks as bookmark (bookmark.id)}
					<li draggable="true">
						<a
							href="/bookmark/{bookmark.id}"
							aria-label="Open {bookmark.title || 'Untitled'}"
							aria-describedby={dragHelpId}
							ondragstart={(e) => {
								if (!e.dataTransfer) return;
								e.dataTransfer.effectAllowed = 'copyMove';
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
							<span class="truncate" title={bookmark.title || 'Untitled'}
								>{bookmark.title || 'Untitled'}</span
							>
						</a>
					</li>
				{/each}
			</ul>
		</details>
	</li>
{/if}
