// ABOUTME: Utility functions for organizing bookmarks into hierarchical tag sections
// ABOUTME: Handles tag hierarchy building and sectioned bookmark organization

import type { Bookmark, TagData } from '$lib/types';
import { Tag } from '$lib/types';

export interface TagSection {
	tag: Tag | null; // null for untagged section
	level: number; // 0 for untagged, 1+ for tag hierarchy (maps to h2-h6)
	bookmarks: Bookmark[];
}

/**
 * Builds a hierarchy map of tags organized by parent-child relationships
 * @param tags Array of tag data
 * @returns Map where key is parentId (null for root tags) and value is array of child tags
 */
export function buildTagHierarchy(tags: TagData[]): Map<string | null, TagData[]> {
	const hierarchy = new Map<string | null, TagData[]>();

	for (const tag of tags) {
		const parentId = tag.parentId;
		if (!hierarchy.has(parentId)) {
			hierarchy.set(parentId, []);
		}
		hierarchy.get(parentId)!.push(tag);
	}

	// Sort each level by order property
	for (const [, children] of hierarchy) {
		children.sort((a, b) => a.order - b.order);
	}

	return hierarchy;
}

/**
 * Recursively builds sections for a tag and its children
 * @param tagData Tag to process
 * @param level Current section level (1+ for tag hierarchy)
 * @param bookmarks All bookmarks to filter from
 * @param hierarchy Tag hierarchy map
 * @param visited Set to track visited tags (prevent circular references)
 * @returns Array of TagSection objects
 */
function buildTagSections(
	tagData: TagData,
	level: number,
	bookmarks: Bookmark[],
	hierarchy: Map<string | null, TagData[]>,
	visited: Set<string>
): TagSection[] {
	if (visited.has(tagData.id) || level > 5) {
		return [];
	}

	visited.add(tagData.id);
	const sections: TagSection[] = [];

	// Find bookmarks for this tag
	const tagBookmarks = bookmarks.filter((bookmark) => bookmark.tags.includes(tagData.id));

	// Process child tags first to determine if we should show this parent
	const children = hierarchy.get(tagData.id) || [];
	const childSections: TagSection[] = [];
	for (const childTag of children) {
		const childTagSections = buildTagSections(
			childTag,
			level + 1,
			bookmarks,
			hierarchy,
			new Set(visited) // Create new set to avoid interference between siblings
		);
		childSections.push(...childTagSections);
	}

	// Create a section if there are direct bookmarks OR if there are child sections
	const hasDirectBookmarks = tagBookmarks.length > 0;
	const hasChildSections = childSections.length > 0;

	if (hasDirectBookmarks || hasChildSections) {
		const tag = new Tag(tagData);
		sections.push({
			tag,
			level,
			bookmarks: tagBookmarks // Will be empty array for parent-only tags
		});
	}

	// Add child sections after parent
	sections.push(...childSections);

	return sections;
}

/**
 * Organizes bookmarks into hierarchical sections based on their tags
 * @param bookmarks Array of bookmarks to organize
 * @param tags Array of tag data for hierarchy
 * @returns Array of TagSection objects in hierarchical order
 */
export function organizeBookmarksIntoSections(
	bookmarks: Bookmark[],
	tags: TagData[]
): TagSection[] {
	const sections: TagSection[] = [];

	// First section: untagged bookmarks
	const untaggedBookmarks = bookmarks.filter((bookmark) => bookmark.tags.length === 0);

	if (untaggedBookmarks.length > 0) {
		sections.push({
			tag: null,
			level: 0, // level 0 for untagged section
			bookmarks: untaggedBookmarks
		});
	}

	// Build tag hierarchy
	const hierarchy = buildTagHierarchy(tags);

	// Process root tags (tags with no parent)
	const rootTags = hierarchy.get(null) || [];
	for (const rootTag of rootTags) {
		const tagSections = buildTagSections(
			rootTag,
			1, // level 1 for root tags (maps to h2)
			bookmarks,
			hierarchy,
			new Set<string>()
		);
		sections.push(...tagSections);
	}

	return sections;
}
