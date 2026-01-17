// ABOUTME: Separate Dexie database for offline content storage (no cloud sync)
// ABOUTME: Provides CRUD operations and reactive queries for stored article content

import Dexie from 'dexie';
import type { OfflineContentData } from '$lib/types';

/**
 * Separate Dexie database for offline content.
 * This is intentionally NOT using dexie-cloud-addon as offline content
 * should remain local to the device and not be synced.
 */
class OfflineDatabase extends Dexie {
	content!: Dexie.Table<OfflineContentData, string>;

	constructor() {
		super('OfflineContent');
		this.version(1).stores({
			// bookmarkId is the primary key, with indexes on savedAt and originalUrl
			content: 'bookmarkId, savedAt, originalUrl'
		});
	}
}

export const offlineDb = new OfflineDatabase();

/**
 * Get offline content for a specific bookmark.
 *
 * @param bookmarkId - The ID of the bookmark
 * @returns Promise that resolves to the content data or undefined if not found
 */
export async function getOfflineContent(
	bookmarkId: string
): Promise<OfflineContentData | undefined> {
	return offlineDb.content.get(bookmarkId);
}

/**
 * Save offline content for a bookmark.
 * Uses put() to upsert - will create or update existing content.
 *
 * @param data - The offline content data to save
 * @returns Promise that resolves when the save is complete
 */
export async function saveOfflineContent(data: OfflineContentData): Promise<void> {
	await offlineDb.content.put(data);
}

/**
 * Delete offline content for a specific bookmark.
 *
 * @param bookmarkId - The ID of the bookmark
 * @returns Promise that resolves when the deletion is complete
 */
export async function deleteOfflineContent(bookmarkId: string): Promise<void> {
	await offlineDb.content.delete(bookmarkId);
}

/**
 * Check if offline content exists for a specific bookmark.
 *
 * @param bookmarkId - The ID of the bookmark
 * @returns Promise that resolves to true if content exists, false otherwise
 */
export async function hasOfflineContent(bookmarkId: string): Promise<boolean> {
	const count = await offlineDb.content.where('bookmarkId').equals(bookmarkId).count();
	return count > 0;
}
