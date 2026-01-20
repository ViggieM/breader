// ABOUTME: Client-side favicon resolution with IndexedDB caching and API fallback
// ABOUTME: Provides async favicon lookup with 7-day retry logic for failed fetches

import {
	getFaviconByDomain,
	saveFavicon,
	shouldRetryFavicon,
	extractDomain
} from '$lib/db/favicons';

/** In-memory cache to avoid redundant IndexedDB lookups during a session */
const memoryCache = new Map<string, string | null>();

/** Pending promises to avoid duplicate fetches for the same domain */
const pendingFetches = new Map<string, Promise<string | null>>();

/**
 * Get Google S2 favicon URL as fallback.
 */
function getGoogleFaviconUrl(domain: string): string {
	return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/** Response type from /api/fetch-favicon endpoint */
interface FaviconApiResponse {
	data?: string;
	error?: string;
	reason?: string;
}

/**
 * Fetch favicon from API and save to IndexedDB.
 * Returns the base64 data URI or null on failure.
 */
async function fetchAndCacheFavicon(domain: string, faviconUrl: string): Promise<string | null> {
	try {
		const response = await fetch('/api/fetch-favicon', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: faviconUrl })
		});

		if (!response.ok) {
			await saveFavicon(domain, null, true, 'fetch_error');
			return null;
		}

		const result: FaviconApiResponse = await response.json();

		if (result.data) {
			await saveFavicon(domain, result.data, false);
			memoryCache.set(domain, result.data);
			return result.data;
		} else {
			await saveFavicon(domain, null, true, result.reason || 'fetch_error');
			memoryCache.set(domain, null);
			return null;
		}
	} catch (err) {
		console.error('Favicon fetch error:', err);
		await saveFavicon(domain, null, true, 'fetch_error');
		memoryCache.set(domain, null);
		return null;
	}
}

/**
 * Resolve favicon for a URL.
 * Checks memory cache, then IndexedDB, then fetches from API if needed.
 *
 * @param url - The bookmark URL to get favicon for
 * @returns Promise that resolves to base64 data URI or null
 */
export async function resolveFavicon(url: string): Promise<string | null> {
	const domain = extractDomain(url);
	if (!domain) {
		return null;
	}

	// Check memory cache first
	if (memoryCache.has(domain)) {
		return memoryCache.get(domain) ?? null;
	}

	// Check if there's already a pending fetch for this domain
	const pending = pendingFetches.get(domain);
	if (pending) {
		return pending;
	}

	// Create a new fetch promise
	const fetchPromise = (async (): Promise<string | null> => {
		try {
			// Check IndexedDB cache
			const cached = await getFaviconByDomain(domain);

			if (cached) {
				if (!cached.failed && cached.data) {
					// Valid cached favicon
					memoryCache.set(domain, cached.data);
					return cached.data;
				}

				if (cached.failed && !shouldRetryFavicon(cached)) {
					// Failed recently, don't retry yet
					memoryCache.set(domain, null);
					return null;
				}

				// Failed but retry window passed, try again
			}

			// No cache or retry needed - fetch from API
			const faviconUrl = getGoogleFaviconUrl(domain);
			return await fetchAndCacheFavicon(domain, faviconUrl);
		} finally {
			// Clean up pending fetch
			pendingFetches.delete(domain);
		}
	})();

	pendingFetches.set(domain, fetchPromise);
	return fetchPromise;
}

/**
 * Resolve favicon for a bookmark object.
 * Convenience wrapper that extracts URL from bookmark.
 *
 * @param bookmark - Object with a url property
 * @returns Promise that resolves to base64 data URI or null
 */
export async function resolveFaviconForBookmark(bookmark: { url: string }): Promise<string | null> {
	return resolveFavicon(bookmark.url);
}

/**
 * Clear the in-memory favicon cache.
 * Useful for testing or when forcing a refresh.
 */
export function clearFaviconMemoryCache(): void {
	memoryCache.clear();
}

/**
 * Pre-populate memory cache from IndexedDB for a list of domains.
 * Useful for batch-loading favicons for a list of bookmarks.
 *
 * @param urls - Array of URLs to pre-load favicons for
 */
export async function preloadFavicons(urls: string[]): Promise<void> {
	const domains = [...new Set(urls.map(extractDomain).filter(Boolean))];

	await Promise.all(
		domains.map(async (domain) => {
			if (!memoryCache.has(domain)) {
				const cached = await getFaviconByDomain(domain);
				if (cached && !cached.failed && cached.data) {
					memoryCache.set(domain, cached.data);
				}
			}
		})
	);
}
