<!-- ABOUTME: Recursive tag menu item component that renders a tag with its bookmarks and child tags -->
<!-- ABOUTME: Uses self-imports for recursive rendering of nested tag structures with depth limiting -->

<script lang="ts">
	import type { TagNode } from '$lib/stores/navigation.svelte';
	import { onMount } from 'svelte';
	import NavigationMenuItem from './NavigationMenuItem.svelte';
	import NavigationMenuBookmark from './NavigationMenuBookmark.svelte';
	import { db } from '$lib/db';
	import { updateBookmarkTags } from '$lib/db/bookmarks';
	import { updateTagParent } from '$lib/db/tags';
	import { descendantMap, ancestorMap, tagMap } from '$lib/stores/tags.svelte';
	import { dragState } from '$lib/stores/dragState.svelte';

	interface Props {
		node: TagNode;
		level?: number;
		onEditTag?: (tag: {
			id: string;
			name: string;
			parentId: string | null;
			childrenCount: number;
		}) => void;
		onDeleteTag?: (tag: {
			id: string;
			name: string;
			parentId: string | null;
			childrenCount: number;
		}) => void;
	}

	let { node, level = 0, onEditTag, onDeleteTag }: Props = $props();

	// Persistent expand/collapse state
	const storageKey = `navigation-expanded-${node.tag.id}`;
	let isOpen = $state(false);
	let detailsElement = $state<HTMLDetailsElement>();

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

	function handleTouchStart(event: TouchEvent) {
		console.log('📱 [TAG TOUCH] touchstart', {
			tagId: node.tag.id,
			tagName: node.tag.name,
			timestamp: new Date().toISOString(),
			eventType: event.type,
			touchCount: event.touches.length,
			touchX: event.touches[0]?.clientX,
			touchY: event.touches[0]?.clientY,
			targetElement: event.target instanceof Element ? event.target.tagName : 'unknown'
		});
	}
</script>

{#if level < 5}
	<li>
		<details
			class="relative"
			id={node.tag.id}
			bind:this={detailsElement}
			open={isOpen}
			ontoggle={handleToggle}
			ondragover={(e) => {
				e.preventDefault();
				if (!e.dataTransfer) {
					console.warn('⚠️ [TAG DROP ZONE] dragover - No dataTransfer');
					return;
				}

				const hasBookmark =
					e.dataTransfer.types.includes('application/x-bookmark-id') ||
					Boolean(dragState.getBookmarkId());
				const hasTag =
					e.dataTransfer.types.includes('application/x-tag-id') || Boolean(dragState.getTagId());

				console.log('🟡 [TAG DROP ZONE] dragover', {
					event: e,
					tagId: node.tag.id,
					tagName: node.tag.name,
					hasBookmark,
					hasTag,
					dataTransferTypes: Array.from(e.dataTransfer.types),
					timestamp: new Date().toISOString()
				});

				if (!hasBookmark && !hasTag) {
					e.dataTransfer.dropEffect = 'none';
					console.log('🟡 [TAG DROP ZONE] dragover - rejected (no valid data type)');
					return;
				}

				e.stopPropagation();
				e.dataTransfer.dropEffect = 'move';
			}}
			ondragenter={(e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('🟢 [TAG DROP ZONE] dragenter', {
					tagId: node.tag.id,
					tagName: node.tag.name,
					timestamp: new Date().toISOString()
				});
			}}
			ondragleave={(e) => {
				e.stopPropagation();
				console.log('🔴 [TAG DROP ZONE] dragleave', {
					tagId: node.tag.id,
					tagName: node.tag.name,
					timestamp: new Date().toISOString()
				});
			}}
			ondrop={async (e) => {
				e.preventDefault();
				e.stopPropagation();

				console.log('🟣 [TAG DROP ZONE] drop event triggered', {
					tagId: node.tag.id,
					tagName: node.tag.name,
					timestamp: new Date().toISOString()
				});

				if (!e.dataTransfer) {
					console.error('❌ [TAG DROP ZONE] drop - No dataTransfer');
					return;
				}

				console.log('🟣 [TAG DROP ZONE] dataTransfer types:', Array.from(e.dataTransfer.types));

				// Handle bookmark drops
				if (
					e.dataTransfer.types.includes('application/x-bookmark-id') ||
					dragState.getBookmarkId()
				) {
					// Try dataTransfer first (desktop)
					let bookmarkId = e.dataTransfer.getData('application/x-bookmark-id');

					// Fallback to global state if dataTransfer is empty (mobile)
					if (!bookmarkId) {
						bookmarkId = dragState.getBookmarkId();
						if (bookmarkId) {
							console.log('📱 [MOBILE FALLBACK] Using stored bookmark ID:', bookmarkId);
						}
					}

					console.log('🟣 [TAG DROP ZONE] Bookmark drop detected', {
						bookmarkId,
						targetTagId: node.tag.id,
						targetTagName: node.tag.name
					});

					if (!bookmarkId) {
						console.error('❌ [TAG DROP ZONE] No bookmark ID found in drag data');
						return;
					}

					try {
						// Get current bookmark
						const bookmark = await db.bookmarks.get(bookmarkId);
						if (!bookmark) {
							console.error('❌ [TAG DROP ZONE] Bookmark not found:', bookmarkId);
							return;
						}

						// Check if tag exists
						if (!node.tag || !node.tag.id) {
							console.error('❌ [TAG DROP ZONE] Invalid tag node:', node);
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
							console.log('✅ [TAG DROP ZONE] Updating bookmark tags', {
								bookmarkId,
								newTags,
								targetTagId: node.tag.id
							});
							// Add the new tag to the existing tags
							await updateBookmarkTags(bookmarkId, newTags);
							console.log('✅ [TAG DROP ZONE] Bookmark tags updated successfully');
						} else {
							console.log('ℹ️ [TAG DROP ZONE] Tag already exists on bookmark, skipping');
						}
					} catch (error) {
						console.error('❌ [TAG DROP ZONE] Failed to update bookmark tags:', error);
					}
				}

				// Handle tag drops
				if (e.dataTransfer.types.includes('application/x-tag-id') || dragState.getTagId()) {
					// Try dataTransfer first (desktop)
					let draggedTagId = e.dataTransfer.getData('application/x-tag-id');

					// Fallback to global state if dataTransfer is empty (mobile)
					if (!draggedTagId) {
						draggedTagId = dragState.getTagId();
						if (draggedTagId) {
							console.log('📱 [MOBILE FALLBACK] Using stored tag ID:', draggedTagId);
						}
					}

					console.log('🟣 [TAG DROP ZONE] Tag drop detected', {
						draggedTagId,
						targetTagId: node.tag.id,
						targetTagName: node.tag.name
					});

					if (!draggedTagId) {
						console.error('❌ [TAG DROP ZONE] No tag ID found in drag data');
						return;
					}

					// Prevent dropping tag on itself
					if (draggedTagId === node.tag.id) {
						console.warn('⚠️ [TAG DROP ZONE] Cannot drop tag on itself');
						return;
					}

					// Prevent circular references: cannot drop on descendants
					const descendants = $descendantMap.get(draggedTagId) || [];
					if (descendants.includes(node.tag.id)) {
						console.warn('⚠️ [TAG DROP ZONE] Cannot drop tag on its descendant');
						return;
					}

					// Prevent dropping on current parent (no-op)
					const draggedTag = $tagMap.get(draggedTagId);
					if (draggedTag && draggedTag.parentId === node.tag.id) {
						console.info('ℹ️ [TAG DROP ZONE] Tag is already a child of this parent');
						return;
					}

					try {
						console.log('✅ [TAG DROP ZONE] Updating tag parent', {
							draggedTagId,
							newParentId: node.tag.id
						});
						await updateTagParent(draggedTagId, node.tag.id);
						console.log('✅ [TAG DROP ZONE] Tag parent updated successfully');
					} catch (error) {
						console.error('❌ [TAG DROP ZONE] Failed to update tag parent:', error);
					}
				}

				// Clear drag state after drop
				dragState.clear();
			}}
		>
			<summary
				class="font-normal"
				data-open={isOpen}
				draggable="true"
				aria-describedby="tag-drag-help"
				aria-label="{node.tag
					.name} tag. Drag to reorganize hierarchy or drop bookmarks to add this tag."
				ontouchstart={handleTouchStart}
				ondragstart={(e) => {
					console.log('🔵 [TAG DRAG] dragstart', {
						tagId: node.tag.id,
						tagName: node.tag.name,
						timestamp: new Date().toISOString(),
						eventType: e.type,
						isTouchEvent: 'touches' in e
					});

					// Set in dataTransfer (works on desktop)
					if (e.dataTransfer) {
						e.dataTransfer.effectAllowed = 'move';
						e.dataTransfer.setData('application/x-tag-id', node.tag.id);
						console.log('🔵 [TAG DRAG] dataTransfer set:', {
							type: 'application/x-tag-id',
							value: node.tag.id,
							effectAllowed: e.dataTransfer.effectAllowed
						});
					} else {
						console.warn('⚠️ [TAG DRAG] No dataTransfer available');
					}

					// ALSO set in global state (fallback for mobile)
					dragState.set('tag', node.tag.id);

					e.currentTarget.style.cursor = 'grabbing';
				}}
				ondragend={(e) => {
					console.log('🔴 [TAG DRAG] dragend', {
						tagId: node.tag.id,
						tagName: node.tag.name,
						timestamp: new Date().toISOString()
					});
					dragState.clear();
					e.currentTarget.style.cursor = '';
				}}
			>
				<span class="icon-[ri--price-tag-3-fill] shrink-0" aria-hidden="true"></span>
				<span class="flex-1 truncate" title={node.tag.name}>{node.tag.name}</span>
			</summary>
			<ul>
				<!-- Child tags (recursive) -->
				{#each node.children as childNode (childNode.tag.id)}
					<NavigationMenuItem node={childNode} level={level + 1} {onEditTag} {onDeleteTag} />
				{/each}

				<!-- Direct bookmarks for this tag -->
				{#each node.bookmarks as bookmark (bookmark.id)}
					<NavigationMenuBookmark {bookmark} />
				{/each}
			</ul>
			{#if isOpen}
				<div class="dropdown dropdown-bottom dropdown-end absolute top-0 right-0">
					<button
						tabindex="0"
						type="button"
						class="btn btn-ghost btn-sm btn-square hover:bg-base-200"
						aria-label="Tag options for {node.tag.name}"
						aria-haspopup="menu"
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<span class="icon-[ri--more-2-fill] shrink-0" aria-hidden="true"></span>
					</button>
					<ul
						role="menu"
						tabindex="-1"
						class="dropdown-content menu bg-base-100 rounded-box z-[1] w-42 p-2 shadow-lg mt-1"
					>
						<li role="menuitem">
							<button
								type="button"
								onclick={() =>
									onEditTag?.({
										id: node.tag.id,
										name: node.tag.name,
										parentId: node.tag.parentId,
										childrenCount: node.children.length
									})}
							>
								<span class="icon-[ri--edit-line]"></span>
								Edit
							</button>
						</li>
						<li role="menuitem">
							<button
								type="button"
								onclick={() =>
									onDeleteTag?.({
										id: node.tag.id,
										name: node.tag.name,
										parentId: node.tag.parentId,
										childrenCount: node.children.length
									})}
							>
								<span class="icon-[ri--delete-bin-line]"></span>
								Delete
							</button>
						</li>
					</ul>
				</div>
			{/if}
		</details>
	</li>
{/if}

<style>
	summary[draggable='true']:active {
		cursor: grabbing;
	}

	/* Hide the default arrow when tag is open */
	summary[data-open='true']::after {
		display: none;
	}
</style>
