// ABOUTME: Utility functions for exporting bookmarks to Netscape HTML format
// ABOUTME: Converts tags to folders, with bookmarks appearing in multiple folders if multi-tagged

import { db } from '$lib/db';
import { getFaviconByDomain, extractDomain } from '$lib/db/favicons';
import type { BookmarkData, TagData } from '$lib/types';

/**
 * Node representation for building tag hierarchy tree
 */
interface TagNode {
	id: string;
	name: string;
	children: TagNode[];
}

/**
 * Convert ISO date string to Unix timestamp (seconds since epoch).
 * Returns null if input is null or invalid.
 *
 * @param isoDate - ISO format date string
 * @returns Unix timestamp in seconds, or null
 */
export function isoToUnixTimestamp(isoDate: string | null): number | null {
	if (!isoDate) return null;
	const timestamp = new Date(isoDate).getTime();
	if (isNaN(timestamp)) return null;
	return Math.floor(timestamp / 1000);
}

/**
 * Escape HTML special characters to prevent XSS and formatting issues.
 *
 * @param text - Text to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Build a hierarchical tree structure from flat tag list.
 * Only includes tags that have bookmarks (directly or in descendants).
 *
 * @param tags - Flat array of TagData
 * @param tagIdsWithBookmarks - Set of tag IDs that have at least one bookmark
 * @returns Array of root TagNode objects
 */
export function buildTagTree(tags: TagData[], tagIdsWithBookmarks: Set<string>): TagNode[] {
	// Create a map of tag ID to TagData for quick lookup
	const tagMap = new Map<string, TagData>();
	for (const tag of tags) {
		tagMap.set(tag.id, tag);
	}

	// Find all tags that should be included (have bookmarks or have descendants with bookmarks)
	const includedTagIds = new Set<string>();

	// Start with tags that have bookmarks and trace up to their ancestors
	for (const tagId of tagIdsWithBookmarks) {
		let currentId: string | null = tagId;
		while (currentId) {
			includedTagIds.add(currentId);
			const tag = tagMap.get(currentId);
			currentId = tag?.parentId ?? null;
		}
	}

	// Build nodes for included tags
	const nodeMap = new Map<string, TagNode>();
	for (const tagId of includedTagIds) {
		const tag = tagMap.get(tagId);
		if (tag) {
			nodeMap.set(tagId, {
				id: tag.id,
				name: tag.name,
				children: []
			});
		}
	}

	// Build parent-child relationships
	const roots: TagNode[] = [];
	for (const tagId of includedTagIds) {
		const tag = tagMap.get(tagId);
		const node = nodeMap.get(tagId);
		if (!tag || !node) continue;

		if (tag.parentId && nodeMap.has(tag.parentId)) {
			// Add to parent's children
			nodeMap.get(tag.parentId)!.children.push(node);
		} else {
			// This is a root node
			roots.push(node);
		}
	}

	// Sort children by name at each level
	function sortChildren(node: TagNode) {
		node.children.sort((a, b) => a.name.localeCompare(b.name));
		node.children.forEach(sortChildren);
	}
	roots.sort((a, b) => a.name.localeCompare(b.name));
	roots.forEach(sortChildren);

	return roots;
}

/**
 * Get all bookmarks organized by tag ID.
 * A bookmark with multiple tags will appear under each tag.
 *
 * @param bookmarks - Array of bookmark data
 * @returns Map where key is tag ID and value is array of bookmarks
 */
export function getBookmarksByTag(bookmarks: BookmarkData[]): Map<string, BookmarkData[]> {
	const result = new Map<string, BookmarkData[]>();

	for (const bookmark of bookmarks) {
		for (const tagId of bookmark.tags) {
			if (!result.has(tagId)) {
				result.set(tagId, []);
			}
			result.get(tagId)!.push(bookmark);
		}
	}

	return result;
}

/**
 * Get bookmarks that have no tags (untagged).
 *
 * @param bookmarks - Array of bookmark data
 * @returns Array of bookmarks with empty tags array
 */
export function getUntaggedBookmarks(bookmarks: BookmarkData[]): BookmarkData[] {
	return bookmarks.filter((bookmark) => bookmark.tags.length === 0);
}

/**
 * Generate a single bookmark entry in Netscape format.
 *
 * @param bookmark - Bookmark data
 * @param favicons - Map of domain to favicon data URI
 * @param indent - Indentation string
 * @returns HTML string for the bookmark
 */
function generateBookmarkEntry(
	bookmark: BookmarkData,
	favicons: Map<string, string>,
	indent: string
): string {
	const title = escapeHtml(bookmark.title || bookmark.url);
	const url = escapeHtml(bookmark.url);
	const addDate = isoToUnixTimestamp(bookmark.created);
	const lastModified = isoToUnixTimestamp(bookmark.modified);

	// Get favicon for this bookmark's domain
	const domain = extractDomain(bookmark.url);
	const favicon = domain ? favicons.get(domain) : undefined;

	let attrs = `HREF="${url}"`;
	if (addDate) attrs += ` ADD_DATE="${addDate}"`;
	if (lastModified) attrs += ` LAST_MODIFIED="${lastModified}"`;
	if (favicon) attrs += ` ICON="${escapeHtml(favicon)}"`;

	return `${indent}<DT><A ${attrs}>${title}</A>\n`;
}

/**
 * Generate folder HTML recursively.
 *
 * @param node - Tag node to generate
 * @param bookmarksByTag - Map of tag ID to bookmarks
 * @param favicons - Map of domain to favicon data URI
 * @param indent - Current indentation
 * @returns HTML string for the folder and its contents
 */
function generateFolderHTML(
	node: TagNode,
	bookmarksByTag: Map<string, BookmarkData[]>,
	favicons: Map<string, string>,
	indent: string
): string {
	let html = '';
	const timestamp = Math.floor(Date.now() / 1000);

	// Folder header
	html += `${indent}<DT><H3 ADD_DATE="${timestamp}">${escapeHtml(node.name)}</H3>\n`;
	html += `${indent}<DL><p>\n`;

	const innerIndent = indent + '    ';

	// Add bookmarks in this folder (sorted by title)
	const bookmarks = bookmarksByTag.get(node.id) || [];
	const sortedBookmarks = [...bookmarks].sort((a, b) =>
		(a.title || a.url).localeCompare(b.title || b.url)
	);

	for (const bookmark of sortedBookmarks) {
		html += generateBookmarkEntry(bookmark, favicons, innerIndent);
	}

	// Add child folders
	for (const child of node.children) {
		html += generateFolderHTML(child, bookmarksByTag, favicons, innerIndent);
	}

	html += `${indent}</DL><p>\n`;

	return html;
}

/**
 * Generate complete Netscape bookmark HTML file.
 *
 * @param tagTree - Hierarchical tag tree
 * @param bookmarksByTag - Map of tag ID to bookmarks
 * @param untaggedBookmarks - Bookmarks with no tags
 * @param favicons - Map of domain to favicon data URI
 * @returns Complete HTML string
 */
export function generateNetscapeHTML(
	tagTree: TagNode[],
	bookmarksByTag: Map<string, BookmarkData[]>,
	untaggedBookmarks: BookmarkData[],
	favicons: Map<string, string>
): string {
	let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

	const indent = '    ';

	// Add untagged bookmarks at root level (sorted by title)
	const sortedUntagged = [...untaggedBookmarks].sort((a, b) =>
		(a.title || a.url).localeCompare(b.title || b.url)
	);

	for (const bookmark of sortedUntagged) {
		html += generateBookmarkEntry(bookmark, favicons, indent);
	}

	// Add tag folders
	for (const node of tagTree) {
		html += generateFolderHTML(node, bookmarksByTag, favicons, indent);
	}

	html += `</DL><p>\n`;

	return html;
}

/**
 * Load all favicons from the database and return as domain → data URI map.
 *
 * @returns Map of domain to favicon data URI (excludes failed favicons)
 */
async function loadFavicons(): Promise<Map<string, string>> {
	const favicons = await db.favicons.toArray();
	const result = new Map<string, string>();

	for (const favicon of favicons) {
		if (favicon.data && !favicon.failed) {
			result.set(favicon.domain, favicon.data);
		}
	}

	return result;
}

/**
 * Main orchestrator function for exporting bookmarks to Netscape HTML format.
 * Loads all bookmarks, tags, and favicons, then generates the HTML file.
 *
 * @returns Promise resolving to the complete HTML string
 */
export async function exportBookmarksToHTML(): Promise<string> {
	// Load all data in parallel
	const [bookmarks, tags, favicons] = await Promise.all([
		db.bookmarks.toArray(),
		db.tags.toArray(),
		loadFavicons()
	]);

	// Organize bookmarks by tag
	const bookmarksByTag = getBookmarksByTag(bookmarks);
	const untaggedBookmarks = getUntaggedBookmarks(bookmarks);

	// Get set of tag IDs that have bookmarks
	const tagIdsWithBookmarks = new Set(bookmarksByTag.keys());

	// Build tag hierarchy tree (only including tags with bookmarks)
	const tagTree = buildTagTree(tags, tagIdsWithBookmarks);

	// Generate the HTML
	return generateNetscapeHTML(tagTree, bookmarksByTag, untaggedBookmarks, favicons);
}
