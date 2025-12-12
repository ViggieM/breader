<!-- ABOUTME: Recursive tag menu item component that renders a tag with its bookmarks and child tags -->
<!-- ABOUTME: Uses self-imports for recursive rendering of nested tag structures with depth limiting -->

<script lang="ts">
	import type { TagNode } from '$lib/stores/navigation.svelte';
	import { onMount } from 'svelte';
	import NavigationMenuItem from './NavigationMenuItem.svelte';

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
		<details bind:this={detailsElement} open={isOpen} ontoggle={handleToggle}>
			<summary
				class="font-normal"
				aria-label="{node.tag.name} tag ({totalCount} {totalCount === 1
					? 'bookmark'
					: 'bookmarks'})"
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
					<li>
						<a href="/bookmark/{bookmark.id}" aria-label="Open {bookmark.title || 'Untitled'}">
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
