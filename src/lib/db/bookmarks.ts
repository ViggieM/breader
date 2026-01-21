// ABOUTME: Database helper functions for querying and managing bookmarks in the Dexie database
// ABOUTME: Provides liveQuery for reactive bookmark fetching and CRUD operations for bookmark persistence

import Dexie from 'dexie';
import { db } from '$lib/db';
import { BookmarkStatus, type BookmarkData, type BookmarkMetaData } from '$lib/types/bookmark';
import {
	trackBookmarkCreated,
	trackBookmarkDeleted,
	trackBookmarkStarred,
	trackBookmarkStatusChanged,
	trackTagsUpdated
} from '$lib/analytics/events';

const { liveQuery } = Dexie;

/**
 * Get a single bookmark by ID using liveQuery.
 * Returns a Dexie Observable that reactively updates when the bookmark changes.
 *
 * @param id - The ID of the bookmark to fetch
 * @returns Observable that emits the BookmarkData or undefined if not found
 */
export function getBookmark(id: string) {
	return liveQuery(async () => {
		return await db.bookmarks.get(id);
	});
}

/**
 * Get all bookmarks sorted by created date using liveQuery.
 * Returns a Dexie Observable that reactively updates when bookmarks change.
 *
 * @returns Observable that emits BookmarkData[] sorted by created date (newest first)
 */
export function getAllBookmarks() {
	return liveQuery(async () => {
		const bookmarks = await db.bookmarks.where('status').above(BookmarkStatus.ARCHIVED).toArray();
		// Sort by modified / created date, newest first
		return bookmarks.sort((a, b) =>
			(b.modified || b.created).localeCompare(a.modified || a.created)
		);
	});
}

/**
 * Get archived bookmarks sorted by created date using liveQuery.
 * Returns a Dexie Observable that reactively updates when bookmarks change.
 *
 * @returns Observable that emits BookmarkData[] sorted by created date (newest first)
 */
export function getArchivedBookmarks() {
	return liveQuery(async () => {
		const bookmarks = await db.bookmarks.where('status').equals(BookmarkStatus.ARCHIVED).toArray();
		// Sort by modified / created date, newest first
		return bookmarks.sort((a, b) =>
			(b.modified || b.created).localeCompare(a.modified || a.created)
		);
	});
}

/**
 * Get favorite bookmarks sorted by created date using liveQuery.
 * Returns a Dexie Observable that reactively updates when bookmarks change.
 *
 * @returns Observable that emits BookmarkData[] sorted by created date (newest first)
 */
export function getFavoriteBookmarks() {
	return liveQuery(async () => {
		const bookmarks = await db.bookmarks.toArray();
		// Sort by modified / created date, newest first
		return bookmarks
			.filter((b) => b.isStarred)
			.sort((a, b) => (b.modified || b.created).localeCompare(a.modified || a.created));
	});
}

/**
 * Create a new bookmark with provided data.
 * Automatically generates id, created timestamp, and sets defaults for missing fields.
 *
 * @param data - Partial bookmark data to create
 * @returns Promise that resolves to the auto-generated bookmark ID
 */
export async function createBookmark(data: Partial<BookmarkData>): Promise<string> {
	const bookmarkData: Omit<BookmarkData, 'id'> = {
		url: data.url ?? '',
		title: data.title ?? null,
		description: data.description ?? '',
		created: new Date().toISOString(),
		modified: null,
		keywords: data.keywords ?? [],
		tags: data.tags ?? [],
		status: data.status ?? 3, // WANT_TO_READ
		isStarred: data.isStarred ?? false,
		meta: data.meta ?? null
	};

	const id = await db.bookmarks.add(bookmarkData as BookmarkData);
	trackBookmarkCreated();
	return id as string;
}

/**
 * Update a bookmark with provided fields.
 * Automatically sets the modified timestamp to the current time.
 *
 * @param id - The ID of the bookmark to update
 * @param updates - Partial bookmark data to update
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmark(id: string, updates: Partial<BookmarkData>): Promise<void> {
	await db.bookmarks.update(id, {
		...updates,
		modified: new Date().toISOString()
	});
}

/**
 * Delete a bookmark from the database.
 *
 * @param id - The ID of the bookmark to delete
 * @returns Promise that resolves when the deletion is complete
 */
export async function deleteBookmark(id: string): Promise<void> {
	await db.bookmarks.delete(id);
	trackBookmarkDeleted();
}

/**
 * Update only the title field of a bookmark.
 *
 * @param id - The ID of the bookmark to update
 * @param title - The new title (or null)
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkTitle(id: string, title: string | null): Promise<void> {
	await updateBookmark(id, { title });
}

/**
 * Update only the URL field of a bookmark.
 *
 * @param id - The ID of the bookmark to update
 * @param url - The new URL
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkUrl(id: string, url: string): Promise<void> {
	await updateBookmark(id, { url });
}

/**
 * Update only the tags array of a bookmark.
 *
 * @param id - The ID of the bookmark to update
 * @param tags - The new tags array
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkTags(id: string, tags: string[]): Promise<void> {
	await updateBookmark(id, { tags });
	trackTagsUpdated();
}

/**
 * Update only the status field of a bookmark.
 *
 * @param id - The ID of the bookmark to update
 * @param status - The new status value
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkStatus(id: string, status: BookmarkStatus): Promise<void> {
	await updateBookmark(id, { status });
	trackBookmarkStatusChanged(status);
}

/**
 * Update only the isStarred field of a bookmark.
 *
 * @param id - The ID of the bookmark to update
 * @param isStarred - The new starred status
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkStar(id: string, isStarred: boolean): Promise<void> {
	await updateBookmark(id, { isStarred });
	trackBookmarkStarred(isStarred);
}

/**
 * Update the metadata object and optionally the title of a bookmark.
 *
 * @param id - The ID of the bookmark to update
 * @param meta - The new metadata object
 * @param title - Optional new title
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkMetadata(
	id: string,
	meta: BookmarkMetaData,
	title?: string
): Promise<void> {
	const updates: Partial<BookmarkData> = { meta };
	if (title !== undefined) {
		updates.title = title;
	}
	await updateBookmark(id, updates);
}

/**
 * Set the metadata status to error with a reason message.
 *
 * @param id - The ID of the bookmark to update
 * @param reason - The error reason message
 * @returns Promise that resolves when the update is complete
 */
export async function updateBookmarkMetadataError(id: string, reason: string): Promise<void> {
	await updateBookmark(id, { meta: { error: true, reason } });
}

/**
 * Set the metadata status to pending (fetching in progress).
 *
 * @param id - The ID of the bookmark to update
 * @returns Promise that resolves when the update is complete
 */
export async function setBookmarkMetadataPending(id: string): Promise<void> {
	await updateBookmark(id, { meta: { pending: true } });
}
