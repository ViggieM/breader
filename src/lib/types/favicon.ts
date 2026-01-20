// ABOUTME: Defines the FaviconData type for caching favicon images as base64 data URIs.
// ABOUTME: Used by the favicons table in IndexedDB for domain-level favicon caching.

/**
 * Represents a cached favicon for a domain.
 * Multiple bookmarks from the same domain share the same favicon entry.
 */
export type FaviconData = {
	/** Auto-generated ID */
	id: string;
	/** Domain hostname (unique) - e.g., "github.com" */
	domain: string;
	/** Base64 data URI of the favicon, null if fetch failed */
	data: string | null;
	/** Whether the favicon fetch failed */
	failed: boolean;
	/** Reason for failure: "too_large" | "fetch_error" | "invalid_image" | null */
	failedReason: string | null;
	/** ISO timestamp of when the record was created */
	createdAt: string;
	/** ISO timestamp of when the record was last modified */
	modifiedAt: string;
};
