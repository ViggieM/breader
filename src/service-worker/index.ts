// ABOUTME: Service worker handling precaching and background metadata fetching with rate limiting
// ABOUTME: Uses Workbox Queue with custom retry logic to handle 429 rate limit responses
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { Queue } from 'workbox-background-sync';
import { updateBookmarkMetadata, updateBookmarkMetadataError } from '../lib/db/bookmarks';
import { saveFavicon, extractDomain } from '../lib/db/favicons';
import {
	type ProcessResult,
	createRateLimitedResult,
	createFailureResult,
	createSuccessResult,
	calculateBackoffDelay,
	delay,
	MIN_RETRY_DELAY_MS
} from './rateLimitRetry';

// This gives `self` the correct types
declare let self: ServiceWorkerGlobalScope;

// this makes sure all other assets are saved for offline use
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// claim clients initially, on first website visit
clientsClaim();

// You need to include on your service worker at least this code
// https://vite-pwa-org.netlify.app/guide/inject-manifest.html#service-worker-code-2
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
		clientsClaim();
	}
});

/**
 * Process a single metadata fetch request.
 * Returns a ProcessResult indicating success, rate limiting, or failure.
 */
async function processMetadataRequest(request: Request): Promise<ProcessResult> {
	try {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 40000); // 40s timeout

		const response = await fetch(request.clone(), { signal: controller.signal });

		// Handle rate limiting specifically
		if (response.status === 429) {
			return createRateLimitedResult(response);
		}

		if (!response.ok) {
			return createFailureResult();
		}

		// Success - process the metadata
		const requestBody = await request.clone().json();
		const originalUrl = requestBody.url;

		const meta = await response.json();
		const { bookmarkId: id, faviconBase64, faviconError, ...data } = meta;
		await updateBookmarkMetadata(id, data, data.title);

		// Save favicon to cache
		const urlForFavicon = originalUrl || data.url;
		if (urlForFavicon) {
			const domain = extractDomain(urlForFavicon);
			if (domain) {
				try {
					if (faviconBase64) {
						await saveFavicon(domain, faviconBase64, false);
					} else if (faviconError) {
						await saveFavicon(domain, null, true, faviconError);
					}
				} catch (faviconErr) {
					console.error('[SW] Failed to save favicon:', faviconErr);
				}
			}
		}

		return createSuccessResult();
	} catch (error) {
		console.error('[SW] Error processing metadata request:', error);
		return createFailureResult();
	}
}

// Create queue with custom onSync handler for rate-limit-aware retries
const queue = new Queue('FetchMetadata', {
	maxRetentionTime: 24 * 60, // 24 hours in minutes
	onSync: async ({ queue }) => {
		let entry;
		let consecutiveFailures = 0;

		while ((entry = await queue.shiftRequest())) {
			const result = await processMetadataRequest(entry.request);

			if (result.success) {
				console.log('[SW] Metadata fetch successful');
				consecutiveFailures = 0;
				// Add delay between successful requests to avoid triggering rate limits
				await delay(MIN_RETRY_DELAY_MS);
			} else if (result.isRateLimited && result.retryAfterMs) {
				// Rate limited - update bookmark status and requeue for later
				try {
					const requestBody = await entry.request.clone().json();
					if (requestBody.id) {
						await updateBookmarkMetadataError(
							requestBody.id,
							'Rate limited - will retry automatically'
						);
					}
				} catch {
					// Couldn't update bookmark status
				}

				// Put request back and stop sync - will retry on next sync event
				await queue.unshiftRequest(entry);
				throw new Error(`Rate limited - retry after ${result.retryAfterMs}ms`);
			} else {
				// Other failure - use exponential backoff
				consecutiveFailures++;

				if (consecutiveFailures >= 5) {
					// Too many failures, mark as failed and move on
					console.error('[SW] Too many consecutive failures for request, skipping');
					try {
						const requestBody = await entry.request.clone().json();
						if (requestBody.id) {
							await updateBookmarkMetadataError(
								requestBody.id,
								'Failed to fetch metadata after multiple retries'
							);
						}
					} catch {
						// Couldn't update bookmark status
					}
					consecutiveFailures = 0;
					continue;
				}

				const backoffDelay = calculateBackoffDelay(consecutiveFailures);
				console.log(
					`[SW] Request failed, waiting ${backoffDelay}ms (attempt ${consecutiveFailures})`
				);
				await delay(backoffDelay);

				// Put request back at the end for retry
				await queue.pushRequest({ request: entry.request });
			}
		}
	}
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'POST' || !url.pathname.includes('/api/fetch-metadata')) {
		return;
	}

	const bgFetchMeta = async () => {
		// Clone and parse request body to get bookmarkId early
		let bookmarkId: string | undefined;
		try {
			const requestBody = await event.request.clone().json();
			bookmarkId = requestBody.id;
		} catch {
			// Couldn't parse request body, continue without bookmarkId
		}

		try {
			const result = await processMetadataRequest(event.request.clone());

			if (result.success) {
				return new Response(JSON.stringify({ success: true }), {
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// For rate limiting or other failures, queue for retry
			if (result.isRateLimited && bookmarkId) {
				await updateBookmarkMetadataError(bookmarkId, 'Rate limited - will retry automatically');
			} else if (bookmarkId) {
				await updateBookmarkMetadataError(bookmarkId, 'Failed - will retry automatically');
			}

			await queue.pushRequest({ request: event.request });
			return new Response(JSON.stringify({ queued: true }), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error) {
			const err = error as Error;
			const reason =
				err.name === 'AbortError' ? 'Request timed out' : err.message || 'Network error';

			if (bookmarkId) {
				await updateBookmarkMetadataError(bookmarkId, reason);
			}
			await queue.pushRequest({ request: event.request });
			return new Response(JSON.stringify({ queued: true, reason }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}
	};

	event.respondWith(bgFetchMeta());
});
