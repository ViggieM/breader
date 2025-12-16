// ABOUTME: Manages tag-related stores (tagMap, childrenMap, ancestorMap, descendantMap) and navigation data structure
// ABOUTME: for hierarchical tag trees with bookmarks, including live queries from Dexie database

import { db } from '$lib/db';
import { Bookmark, type BookmarkData, Tag, type TagData } from '$lib/types';
import Dexie from 'dexie';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { derived, readable, type Readable } from 'svelte/store';

const { liveQuery } = Dexie;

export const tagsData = readable<TagData[]>([], (set) => {
	const observable = liveQuery(() => db.tags.toArray());
	const subscription = observable.subscribe((data: TagData[] | undefined) => {
		if (data) set(data);
	});

	return () => subscription.unsubscribe();
});

const tagInstances = derived(tagsData, (tagsData) => {
	return tagsData.map((data) => new Tag(data));
});

export const tagMap = derived(tagInstances, ($tagInstances) => {
	const map = new SvelteMap<string, Tag>();
	$tagInstances.forEach((tag) => map.set(tag.id, tag));
	return map;
});

export const childrenMap = derived(tagInstances, ($tagInstances) => {
	const map = new SvelteMap<string, string[]>();
	$tagInstances.forEach((tag) => {
		const parentId = tag.parentId || 'root';
		if (!map.has(parentId)) map.set(parentId, []);
		map.get(parentId)!.push(tag.id);
	});
	return map;
});

export const ancestorMap = derived([tagInstances, tagMap], ([$tagInstances, $tagMap]) => {
	const map = new SvelteMap<string, string[]>();
	$tagInstances.forEach((tag) => {
		const ancestors: string[] = [];
		let current = tag.parentId;
		while (current && $tagMap.get(current)) {
			ancestors.push(current);
			current = $tagMap.get(current)!.parentId;
		}
		map.set(tag.id, ancestors);
	});
	return map;
});

export const descendantMap = derived(
	[tagInstances, childrenMap],
	([$tagInstances, $childrenMap]) => {
		const map = new SvelteMap<string, string[]>();
		const getDescendants = (tagId: string): string[] => {
			const children = $childrenMap.get(tagId) || [];
			const descendants = [...children];
			children.forEach((childId) => {
				descendants.push(...getDescendants(childId));
			});
			return descendants;
		};

		$tagInstances.forEach((tag) => {
			map.set(tag.id, getDescendants(tag.id));
		});
		return map;
	}
);

export interface TagNode {
	tag: Tag;
	bookmarks: Bookmark[];
	children: TagNode[];
	hasBookmarks: boolean;
}

export interface NavigationData {
	untagged: Bookmark[];
	tagTree: TagNode[];
}

/**
 * Creates a derived store that builds navigation data from bookmarks and tags
 * @param bookmarksStore - Store containing the bookmarks to process
 * @returns Derived store with navigation data structure
 */
export function createTagMenuData(bookmarksStore: Readable<BookmarkData[]>) {
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

				const newVisited = new SvelteSet(visited);
				newVisited.add(tagId);

				const node: TagNode = {
					tag,
					bookmarks: tagBookmarksMap.get(tagId) || [],
					children: buildTagTree(tagId, depth + 1, newVisited),
					hasBookmarks: hasBookmarks(tagId)
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
