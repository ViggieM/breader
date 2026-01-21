// ABOUTME: Utility functions for parsing and importing HTML bookmark files
// ABOUTME: Converts nested bookmark structures to flat format and creates hierarchical tags
import type { UUID } from 'node:crypto';
import { db } from '$lib/db';
import { createBookmark } from '$lib/db/bookmarks';
import { saveFavicon, extractDomain, getFaviconByDomain } from '$lib/db/favicons';
import { BookmarkStatus, type TagData, type BookmarkData } from '$lib/types';

interface Bookmark {
	id: UUID;
	type: 'bookmark';
	title: string;
	url: string;
	add_date?: string | null;
	icon: string | null;
}

interface Folder {
	id: UUID;
	type: 'folder';
	name: string;
	open: boolean;
	items: BookmarkItem[];
}

type BookmarkItem = Bookmark | Folder;

export interface FlattenedBookmark {
	url: string;
	title: string;
	addDate: string | null;
	icon: string | null;
	folderPath: Array<{ name: string }>;
}

export function parseBookmarksHTML(html: string): BookmarkItem[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const rootDL = doc.querySelector('DL');

	if (!rootDL) {
		throw new Error('Invalid bookmarks HTML: <DL> root not found.');
	}

	return parseDL(rootDL as HTMLDListElement);
}

function parseDL(dl: HTMLDListElement): BookmarkItem[] {
	const result: BookmarkItem[] = [];

	for (let i = 0; i < dl.children.length; i++) {
		const node = dl.children[i];

		if (node.tagName === 'DT') {
			const h3 = node.querySelector('H3');
			const a = node.querySelector('A');

			if (h3) {
				// This is a folder
				const folder: Folder = {
					id: crypto.randomUUID(),
					type: 'folder',
					name: h3.textContent || 'Untitled Folder',
					open: true,
					items: []
				};

				// Look for the next sibling that is a DL (folder contents)
				const items = node.querySelector('DL');
				if (items) {
					folder.items = parseDL(items as HTMLDListElement);
					i++; // Skip the DL element in next iteration since we processed it
				}

				result.push(folder);
			} else if (a) {
				// This is a bookmark
				const bookmark: Bookmark = {
					id: crypto.randomUUID(),
					type: 'bookmark',
					title: a.textContent || 'Untitled',
					url: a.getAttribute('HREF') || '',
					add_date: a.getAttribute('ADD_DATE'),
					icon: a.getAttribute('ICON')
				};
				result.push(bookmark);
			}
		}
	}

	return result;
}

/**
 * Flattens nested bookmark structure into a flat array suitable for database import.
 * Preserves folder hierarchy by converting it to folderPath arrays.
 *
 * @param items - Nested BookmarkItem array from parseBookmarksHTML
 * @param currentPath - Current folder path (used during recursion)
 * @returns Array of flattened bookmarks with folder paths
 */
export function flattenBookmarks(
	items: BookmarkItem[],
	currentPath: Array<{ name: string }> = []
): FlattenedBookmark[] {
	const result: FlattenedBookmark[] = [];

	for (const item of items) {
		if (item.type === 'bookmark') {
			// Convert add_date timestamp (seconds) to ISO string
			let addDate: string | null = null;
			if (item.add_date) {
				const timestamp = parseInt(item.add_date);
				if (!isNaN(timestamp)) {
					addDate = new Date(timestamp * 1000).toISOString();
				}
			}

			result.push({
				url: item.url,
				title: item.title,
				addDate,
				icon: item.icon,
				folderPath: [...currentPath] // Copy the current path
			});
		} else if (item.type === 'folder') {
			// Recursively process folder with updated path
			const newPath = [...currentPath, { name: item.name }];
			const folderBookmarks = flattenBookmarks(item.items, newPath);
			result.push(...folderBookmarks);
		}
	}

	return result;
}

export interface TagPathItem {
	name: string;
}

/**
 * Helper function to generate a consistent cache key for a folder path.
 * Used as Map key for looking up tag IDs by their hierarchical path.
 *
 * @param path - Array of folder objects representing the path from root to leaf
 * @returns JSON string representation of the path for use as cache key
 */
export function getPathKey(path: TagPathItem[]): string {
	return JSON.stringify(path);
}

/**
 * Creates hierarchical tags from bookmark folder paths.
 * Processes tags from root to leaf, ensuring parent-child relationships are correct.
 * Uses caching to avoid creating duplicate tags.
 *
 * @param bookmarks - Array of flattened bookmarks with folderPath information
 * @returns Map where key is JSON-stringified path and value is the leaf tag ID
 */
export async function createHierarchicalTags(
	bookmarks: FlattenedBookmark[]
): Promise<Map<string, string>> {
	const pathTagMap = new Map<string, string>();
	const tagCache = new Map<string, string>(); // Cache format: JSON.stringify({ name, parentId }) -> tagId

	// Extract all unique folder paths
	const uniquePaths = new Set<string>();
	for (const bookmark of bookmarks) {
		if (bookmark.folderPath.length > 0) {
			uniquePaths.add(getPathKey(bookmark.folderPath));
		}
	}

	// Process each unique path
	for (const pathKey of uniquePaths) {
		const path: TagPathItem[] = JSON.parse(pathKey);
		let currentParentId: string | null = null;

		// Process folders from root to leaf
		for (const folder of path) {
			const cacheKey: string = JSON.stringify({ name: folder.name, parentId: currentParentId });

			// Check if tag exists in cache
			if (tagCache.has(cacheKey)) {
				currentParentId = tagCache.get(cacheKey)!;
				continue;
			}

			// Query database for existing tag with this name and parent
			const existingTag = await db.tags
				.where('name')
				.equals(folder.name)
				.filter((tag) => tag.parentId === currentParentId)
				.first();

			if (existingTag) {
				// Tag exists in database, add to cache
				tagCache.set(cacheKey, existingTag.id);
				currentParentId = existingTag.id;
			} else {
				// Create new tag
				const newTagData: TagData = {
					name: folder.name,
					parentId: currentParentId,
					order: 0
				} as TagData;

				const newTagId = await db.tags.add(newTagData);
				tagCache.set(cacheKey, newTagId as string);
				currentParentId = newTagId as string;
			}
		}

		// Store the final leaf tag ID for this path
		pathTagMap.set(pathKey, currentParentId!);
	}

	return pathTagMap;
}

/**
 * Finds duplicate URLs that already exist in the database.
 * Used to prevent importing bookmarks that are already saved.
 *
 * @param urls - Array of URLs to check for duplicates
 * @returns Set of URLs that already exist in the database
 */
export async function findDuplicateUrls(urls: string[]): Promise<Set<string>> {
	const existingBookmarks = await db.bookmarks.where('url').anyOf(urls).toArray();
	return new Set(existingBookmarks.map((bookmark) => bookmark.url));
}

export interface ImportResult {
	successCount: number;
	skippedCount: number;
	faviconsSaved: number;
	errors: Array<{ url: string; error: string }>;
}

/**
 * Saves favicons from imported bookmarks to IndexedDB.
 * Only saves favicons for domains that don't already have a cached favicon.
 * Validates that the icon data is a valid data URI before saving.
 *
 * @param bookmarks - Array of flattened bookmarks with icon data
 * @returns Number of favicons saved
 */
async function saveFaviconsFromImport(bookmarks: FlattenedBookmark[]): Promise<number> {
	let savedCount = 0;

	// Group bookmarks by domain to avoid duplicate saves
	const domainIcons = new Map<string, string>();

	for (const bookmark of bookmarks) {
		if (!bookmark.icon) continue;

		const domain = extractDomain(bookmark.url);
		if (!domain) continue;

		// Only keep the first icon we find for each domain
		if (!domainIcons.has(domain)) {
			domainIcons.set(domain, bookmark.icon);
		}
	}

	// Save each unique domain's favicon
	for (const [domain, iconData] of domainIcons) {
		try {
			// Check if favicon already exists for this domain
			const existing = await getFaviconByDomain(domain);
			if (existing && !existing.failed) {
				// Already have a valid favicon, skip
				continue;
			}

			// Validate that it's a data URI (browser exports use data:image/... format)
			if (!iconData.startsWith('data:image/')) {
				continue;
			}

			// Save the favicon
			await saveFavicon(domain, iconData, false);
			savedCount++;
		} catch {
			// Silently skip failed favicon saves - not critical for import
		}
	}

	return savedCount;
}

/**
 * Imports bookmarks to the database with duplicate detection.
 * Uses bulk insert for efficiency, falls back to individual inserts on error.
 *
 * @param bookmarks - Array of flattened bookmarks to import
 * @param pathTagMap - Map of folder paths to tag IDs for tagging bookmarks
 * @param duplicateUrls - Set of URLs that already exist in database (will be skipped)
 * @returns ImportResult with counts of successful, skipped, and failed imports
 */
export async function importBookmarksToDatabase(
	bookmarks: FlattenedBookmark[],
	pathTagMap: Map<string, string>,
	duplicateUrls: Set<string>
): Promise<ImportResult> {
	const result: ImportResult = {
		successCount: 0,
		skippedCount: 0,
		faviconsSaved: 0,
		errors: []
	};

	// Save favicons from all bookmarks (including duplicates, as they may have new icons)
	result.faviconsSaved = await saveFaviconsFromImport(bookmarks);

	// Filter out duplicates
	const bookmarksToImport = bookmarks.filter((bookmark) => {
		if (duplicateUrls.has(bookmark.url)) {
			result.skippedCount++;
			return false;
		}
		return true;
	});

	// Transform to BookmarkData format
	const bookmarkDataArray: Omit<BookmarkData, 'id'>[] = bookmarksToImport.map((bookmark) => {
		// Get tag ID for this bookmark's folder path
		let tags: string[] = [];
		if (bookmark.folderPath.length > 0) {
			const pathKey = getPathKey(bookmark.folderPath);
			const tagId = pathTagMap.get(pathKey);
			if (tagId) {
				tags = [tagId];
			}
		}

		return {
			url: bookmark.url,
			title: bookmark.title || null,
			description: '',
			created: bookmark.addDate || new Date().toISOString(),
			modified: null,
			keywords: [],
			tags,
			status: BookmarkStatus.WANT_TO_READ,
			isStarred: false,
			meta: null
		};
	});

	// Try bulk insert first
	try {
		await db.bookmarks.bulkAdd(bookmarkDataArray as BookmarkData[], { allKeys: true });
		result.successCount = bookmarkDataArray.length;
	} catch {
		// Bulk insert failed, fall back to individual inserts
		for (let i = 0; i < bookmarkDataArray.length; i++) {
			const bookmarkData = bookmarkDataArray[i];
			const originalBookmark = bookmarksToImport[i];

			try {
				await createBookmark(bookmarkData);
				result.successCount++;
			} catch (err) {
				result.errors.push({
					url: originalBookmark.url,
					error: err instanceof Error ? err.message : 'Unknown error'
				});
			}
		}
	}

	return result;
}

/**
 * Main orchestrator function for the entire bookmark import process.
 * Coordinates parsing, flattening, tag creation, duplicate detection, and database import.
 *
 * @param html - Raw HTML string from bookmark export file
 * @returns ImportResult with counts of successful, skipped, and failed imports
 * @throws Error if parsing or critical operations fail
 */
export async function processBookmarkImport(html: string): Promise<ImportResult> {
	// Step 1: Parse HTML to nested structure
	const parsed = parseBookmarksHTML(html);

	// Step 2: Flatten bookmarks and preserve folder paths
	const flattened = flattenBookmarks(parsed);

	// Step 3: Create hierarchical tags and get path → tag ID mapping
	const pathTagMap = await createHierarchicalTags(flattened);

	// Step 4: Extract all URLs for duplicate detection
	const urls = flattened.map((bookmark) => bookmark.url);

	// Step 5: Find duplicate URLs in database
	const duplicateUrls = await findDuplicateUrls(urls);

	// Step 6: Import bookmarks with tag associations
	const result = await importBookmarksToDatabase(flattened, pathTagMap, duplicateUrls);

	return result;
}
