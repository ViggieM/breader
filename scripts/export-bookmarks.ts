// ABOUTME: Standalone script to export bookmarks from bookmarks.json to Netscape HTML format
// ABOUTME: Reads JSON data, converts to arrays, and uses export utility functions for HTML generation

import * as fs from 'node:fs';
import * as path from 'node:path';

// Types matching the app's types (copied to avoid import issues with SvelteKit paths)
interface BookmarkData {
	id: string;
	url: string;
	title?: string | null;
	description?: string;
	tags: string[];
	created: string;
	modified: string | null;
	keywords: string[];
	isStarred?: boolean;
	isReviewed?: boolean;
}

interface TagData {
	id: string;
	name: string;
	parentId: string | null;
	order: number;
}

interface FaviconData {
	id: string;
	domain: string;
	data: string | null;
	failed: boolean;
	failedReason?: string | null;
}

interface OwnerData {
	bookmarks: Record<string, BookmarkData>;
	tags: Record<string, TagData>;
	favicons: Record<string, FaviconData>;
	notes?: Record<string, unknown>;
}

interface JsonData {
	data: Record<string, OwnerData>;
}

interface TagNode {
	id: string;
	name: string;
	children: TagNode[];
}

// ============================================================================
// Utility functions (copied from export.ts to avoid SvelteKit import issues)
// ============================================================================

/**
 * Extract domain from URL.
 */
function extractDomain(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

/**
 * Convert ISO date string to Unix timestamp (seconds since epoch).
 */
function isoToUnixTimestamp(isoDate: string | null): number | null {
	if (!isoDate) return null;
	const timestamp = new Date(isoDate).getTime();
	if (isNaN(timestamp)) return null;
	return Math.floor(timestamp / 1000);
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Build a hierarchical tree structure from flat tag list.
 * Only includes tags that have bookmarks (directly or in descendants).
 */
function buildTagTree(tags: TagData[], tagIdsWithBookmarks: Set<string>): TagNode[] {
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
			nodeMap.get(tag.parentId)!.children.push(node);
		} else {
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
 */
function getBookmarksByTag(bookmarks: BookmarkData[]): Map<string, BookmarkData[]> {
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
 * Get bookmarks that have no tags.
 */
function getUntaggedBookmarks(bookmarks: BookmarkData[]): BookmarkData[] {
	return bookmarks.filter((bookmark) => bookmark.tags.length === 0);
}

/**
 * Generate a single bookmark entry in Netscape format.
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
 */
function generateFolderHTML(
	node: TagNode,
	bookmarksByTag: Map<string, BookmarkData[]>,
	favicons: Map<string, string>,
	indent: string
): string {
	let html = '';
	const timestamp = Math.floor(Date.now() / 1000);

	html += `${indent}<DT><H3 ADD_DATE="${timestamp}">${escapeHtml(node.name)}</H3>\n`;
	html += `${indent}<DL><p>\n`;

	const innerIndent = indent + '    ';

	const bookmarks = bookmarksByTag.get(node.id) || [];
	const sortedBookmarks = [...bookmarks].sort((a, b) =>
		(a.title || a.url).localeCompare(b.title || b.url)
	);

	for (const bookmark of sortedBookmarks) {
		html += generateBookmarkEntry(bookmark, favicons, innerIndent);
	}

	for (const child of node.children) {
		html += generateFolderHTML(child, bookmarksByTag, favicons, innerIndent);
	}

	html += `${indent}</DL><p>\n`;

	return html;
}

/**
 * Generate complete Netscape bookmark HTML file.
 */
function generateNetscapeHTML(
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

	const sortedUntagged = [...untaggedBookmarks].sort((a, b) =>
		(a.title || a.url).localeCompare(b.title || b.url)
	);

	for (const bookmark of sortedUntagged) {
		html += generateBookmarkEntry(bookmark, favicons, indent);
	}

	for (const node of tagTree) {
		html += generateFolderHTML(node, bookmarksByTag, favicons, indent);
	}

	html += `</DL><p>\n`;

	return html;
}

// ============================================================================
// Main script logic
// ============================================================================

const TARGET_OWNER = '9d5df226-7605-42a8-91ab-d4cf6709b667';

function main() {
	// Resolve paths relative to project root
	const projectRoot = path.resolve(import.meta.dirname, '..');
	const inputFile = path.join(projectRoot, 'bookmarks.json');
	const outputFile = path.join(projectRoot, `breader-export-${TARGET_OWNER.slice(0, 8)}.html`);

	console.log('Reading bookmarks.json...');
	const jsonContent = fs.readFileSync(inputFile, 'utf-8');
	const jsonData: JsonData = JSON.parse(jsonContent);

	// Extract owner data
	const ownerData = jsonData.data[TARGET_OWNER];
	if (!ownerData) {
		console.error(`Owner ${TARGET_OWNER} not found in JSON data`);
		process.exit(1);
	}

	// Convert object maps to arrays
	const bookmarks = Object.values(ownerData.bookmarks);
	const tags = Object.values(ownerData.tags);
	const faviconRecords = Object.values(ownerData.favicons);

	console.log(`Found ${bookmarks.length} bookmarks`);
	console.log(`Found ${tags.length} tags`);
	console.log(`Found ${faviconRecords.length} favicon records`);

	// Build favicon domain→data map (exclude failed)
	const favicons = new Map<string, string>();
	for (const favicon of faviconRecords) {
		if (favicon.data && !favicon.failed) {
			favicons.set(favicon.domain, favicon.data);
		}
	}
	console.log(`Loaded ${favicons.size} valid favicons`);

	// Organize bookmarks by tag
	const bookmarksByTag = getBookmarksByTag(bookmarks);
	const untaggedBookmarks = getUntaggedBookmarks(bookmarks);

	console.log(`Untagged bookmarks: ${untaggedBookmarks.length}`);

	// Get set of tag IDs that have bookmarks
	const tagIdsWithBookmarks = new Set(bookmarksByTag.keys());

	// Build tag hierarchy tree
	const tagTree = buildTagTree(tags, tagIdsWithBookmarks);

	console.log(`Tag tree root nodes: ${tagTree.length}`);

	// Generate HTML
	const html = generateNetscapeHTML(tagTree, bookmarksByTag, untaggedBookmarks, favicons);

	// Write output file
	fs.writeFileSync(outputFile, html, 'utf-8');
	console.log(`\nExported to: ${outputFile}`);
	console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
}

main();
