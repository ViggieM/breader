// ABOUTME: Creates navigation menu data structure by combining bookmarks and tags into a hierarchical tree
// ABOUTME: with untagged bookmarks section and recursive tag nodes with their associated bookmarks

import { derived, type Readable } from 'svelte/store';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { childrenMap, tagMap } from '$lib/stores/tags.svelte';
import { Bookmark, type BookmarkData, type Tag } from '$lib/types';

export interface TagNode {
	tag: Tag;
	bookmarks: Bookmark[];
	children: TagNode[];
}

export interface NavigationData {
	untagged: Bookmark[];
	tagTree: TagNode[];
}

/**
 * Creates a derived store that builds navigation data from bookmarks and tags
 * @param bookmarksStore - Store containing the bookmarks to process
 * @param hideTagsWithoutBookmarks - Hide tags that have not bookmarks
 * @returns Derived store with navigation data structure
 */
export function createNavigationData(
	bookmarksStore: Readable<BookmarkData[]>,
	hideTagsWithoutBookmarks: boolean = true
) {
	return derived([bookmarksStore, childrenMap, tagMap], ([$bookmarks, $childrenMap, $tagMap]) => {
		// Filter untagged bookmarks (bookmarks with no tags)
		const untagged = $bookmarks
			.filter((bookmark) => bookmark.tags.length === 0)
			.map((data) => new Bookmark(data));

		// Build a map of tag IDs to their bookmarks
		const tagBookmarksMap = new SvelteMap<string, Bookmark[]>();
		$bookmarks.forEach((bookmark) => {
			bookmark.tags.forEach((tagId) => {
				if (!tagBookmarksMap.has(tagId)) {
					tagBookmarksMap.set(tagId, []);
				}
				tagBookmarksMap.get(tagId)!.push(new Bookmark(bookmark));
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
				if (hideTagsWithoutBookmarks && !hasBookmarks(tagId)) continue;

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
	});
}
