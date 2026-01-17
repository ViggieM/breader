// ABOUTME: Type definitions for offline content storage feature
// ABOUTME: Defines the data structure for storing extracted article content locally

/**
 * Represents offline content data stored in the local IndexedDB.
 * This is separate from the main Dexie Cloud database and is not synced.
 */
export interface OfflineContentData {
	/** UUID reference to the associated bookmark (primary key) */
	bookmarkId: string;
	/** Clean HTML content extracted by Readability */
	content: string;
	/** ISO timestamp when the content was saved */
	savedAt: string;
	/** Original URL the content was extracted from */
	originalUrl: string;
	/** Article title extracted by Readability */
	title?: string | null;
	/** Article excerpt/summary extracted by Readability */
	excerpt?: string | null;
}
