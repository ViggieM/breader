// ABOUTME: Privacy-focused PostHog event definitions
// ABOUTME: Tracks feature usage only - no URLs, queries, or personal data

// Safe capture function that works in any context (browser, service worker, SSR)
// Only captures if running in main browser window with PostHog initialized
function capture(event: string, properties?: Record<string, unknown>) {
	if (
		typeof window !== 'undefined' &&
		'posthog' in window &&
		typeof (
			window as unknown as {
				posthog: { capture: (e: string, p?: Record<string, unknown>) => void };
			}
		).posthog?.capture === 'function'
	) {
		(
			window as unknown as {
				posthog: { capture: (e: string, p?: Record<string, unknown>) => void };
			}
		).posthog.capture(event, properties);
	}
}

// Bookmark feature events (no content/URLs tracked)
export function trackBookmarkCreated() {
	capture('bookmark_created');
}

export function trackBookmarkDeleted() {
	capture('bookmark_deleted');
}

export function trackBookmarkStarred(isStarred: boolean) {
	capture('bookmark_starred', { starred: isStarred });
}

export function trackBookmarkStatusChanged(status: number) {
	capture('bookmark_status_changed', { status });
}

// Search feature (just that it was used, not the query)
export function trackSearchUsed() {
	capture('search_used');
}

// Note feature (just that it was used)
export function trackNoteCreated() {
	capture('note_created');
}

export function trackNoteDeleted() {
	capture('note_deleted');
}

// Tag feature
export function trackTagsUpdated() {
	capture('tags_updated');
}

// Import feature
export function trackBookmarksImported() {
	capture('bookmarks_imported');
}
