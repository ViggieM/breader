// ABOUTME: Creates navigation menu data structure by combining bookmarks and tags into a hierarchical tree
// ABOUTME: with untagged bookmarks section and recursive tag nodes with their associated bookmarks

import { derived } from 'svelte/store';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { results } from '$lib/components/SearchBar.svelte';
import { childrenMap, tagMap } from '$lib/stores/tags.svelte';
import type { Bookmark, Tag } from '$lib/types';

export interface TagNode {
	tag: Tag;
	bookmarks: Bookmark[];
	children: TagNode[];
}

export interface NavigationData {
	untagged: Bookmark[];
	tagTree: TagNode[];
}

export const navigationData = derived(
	[results, childrenMap, tagMap],
	([$results, $childrenMap, $tagMap]) => {
		// Filter untagged bookmarks (bookmarks with no tags)
		const untagged = $results.filter((bookmark) => bookmark.tags.length === 0);

		// Build a map of tag IDs to their bookmarks
		const tagBookmarksMap = new SvelteMap<string, Bookmark[]>();
		$results.forEach((bookmark) => {
			bookmark.tags.forEach((tagId) => {
				if (!tagBookmarksMap.has(tagId)) {
					tagBookmarksMap.set(tagId, []);
				}
				tagBookmarksMap.get(tagId)!.push(bookmark);
			});
		});

		// Helper function to check if a tag has bookmarks (direct or in descendants)
		const hasBookmarks = (tagId: string, visited = new SvelteSet<string>()): boolean => {
			// Prevent circular references
			if (visited.has(tagId)) return false;
			visited.add(tagId);

			// Check if tag has direct bookmarks
			if (tagBookmarksMap.has(tagId) && tagBookmarksMap.get(tagId)!.length > 0) {
				return true;
			}

			// Check if any children have bookmarks
			const children = $childrenMap.get(tagId) || [];
			return children.some((childId) => hasBookmarks(childId, visited));
		};

		// Recursively build tag tree
		const buildTagTree = (
			parentId: string | null,
			depth = 0,
			visited = new SvelteSet<string>()
		): TagNode[] => {
			// Limit depth to 5 levels to prevent performance issues
			if (depth >= 5) return [];

			const childIds = $childrenMap.get(parentId === null ? 'root' : parentId) || [];
			const nodes: TagNode[] = [];

			for (const tagId of childIds) {
				// Prevent circular references
				if (visited.has(tagId)) continue;

				const tag = $tagMap.get(tagId);
				if (!tag) continue;

				// Only include tags that have bookmarks or children with bookmarks
				if (!hasBookmarks(tagId)) continue;

				const newVisited = new SvelteSet(visited);
				newVisited.add(tagId);

				const node: TagNode = {
					tag,
					bookmarks: tagBookmarksMap.get(tagId) || [],
					children: buildTagTree(tagId, depth + 1, newVisited)
				};

				nodes.push(node);
			}

			// Sort by tag order
			return nodes.sort((a, b) => a.tag.order - b.tag.order);
		};

		const tagTree = buildTagTree(null);

		return {
			untagged,
			tagTree
		};
	}
);
