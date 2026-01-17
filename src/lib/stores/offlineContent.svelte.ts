// ABOUTME: Helper functions for saving and refreshing offline content for bookmarks
// ABOUTME: Provides save and refresh operations that call the server API and persist to local DB

import { saveOfflineContent, deleteOfflineContent } from '$lib/db/offline';
import type { OfflineContentData } from '$lib/types';

/**
 * Response type for save/refresh operations
 */
interface SaveResult {
	success: boolean;
	error?: string;
}

/**
 * Fetch content from a URL and save it for offline reading.
 * Calls the server-side API to extract article content, then saves to local database.
 *
 * @param bookmarkId - The ID of the bookmark to save content for
 * @param url - The URL to extract content from
 * @returns Promise with success status and optional error message
 */
export async function saveOfflineContentForBookmark(
	bookmarkId: string,
	url: string
): Promise<SaveResult> {
	try {
		const response = await fetch('/api/extract-content', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ bookmarkId, url })
		});

		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as { message?: string };
			return {
				success: false,
				error: errorData.message || `Failed to extract content (${response.status})`
			};
		}

		const data = (await response.json()) as {
			bookmarkId: string;
			content: string;
			title: string | null;
			excerpt: string | null;
			originalUrl: string;
		};

		// Save to offline database
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- One-time timestamp creation, not reactive state
		const savedAt = new Date().toISOString();
		const offlineData: OfflineContentData = {
			bookmarkId: data.bookmarkId,
			content: data.content,
			savedAt,
			originalUrl: data.originalUrl,
			title: data.title,
			excerpt: data.excerpt
		};

		await saveOfflineContent(offlineData);

		return { success: true };
	} catch (err) {
		console.error('Error saving offline content:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'An unexpected error occurred'
		};
	}
}

/**
 * Refresh existing offline content by re-fetching from the original URL.
 * Deletes old content first, then saves fresh content.
 *
 * @param bookmarkId - The ID of the bookmark to refresh content for
 * @param url - The URL to extract content from
 * @returns Promise with success status and optional error message
 */
export async function refreshOfflineContent(bookmarkId: string, url: string): Promise<SaveResult> {
	try {
		// Delete existing content first
		await deleteOfflineContent(bookmarkId);

		// Re-fetch and save fresh content
		return await saveOfflineContentForBookmark(bookmarkId, url);
	} catch (err) {
		console.error('Error refreshing offline content:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'An unexpected error occurred'
		};
	}
}
