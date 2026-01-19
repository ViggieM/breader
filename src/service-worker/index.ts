// ABOUTME: Self-destructing service worker that unregisters itself and clears all caches
// ABOUTME: This service worker will remove itself and clean up on activation
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { Queue } from 'workbox-background-sync';
import { updateBookmarkMetadata, updateBookmarkMetadataError } from '../lib/db/bookmarks';

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

const queue = new Queue('FetchMetadata');

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'POST' || !url.pathname.includes('/api/fetch-metadata')) {
		return;
	}

	const bgFetchMeta = async () => {
		// Clone and parse request body to get bookmarkId early for error handling
		let bookmarkId: string | undefined;
		try {
			const requestBody = await event.request.clone().json();
			bookmarkId = requestBody.id;
		} catch {
			// Couldn't parse request body, continue without bookmarkId
		}

		try {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), 40000); // 40s timeout (30s API + buffer)
			const response = await fetch(event.request.clone(), { signal: controller.signal });

			if (!response.ok) {
				const errorText = await response.text();
				if (bookmarkId) {
					await updateBookmarkMetadataError(
						bookmarkId,
						`Server error: ${response.status} ${errorText || response.statusText}`
					);
				}
				await queue.pushRequest({ request: event.request });
				return response;
			}

			const meta = await response.clone().json();
			const { bookmarkId: id, ...data } = meta;
			await updateBookmarkMetadata(id, data, data.title);
			return response;
		} catch (error) {
			const err = error as Error;
			let reason: string;
			if (err.name === 'AbortError') {
				console.log('FetchMetadata Request Aborted');
				reason = 'Request timed out';
			} else {
				reason = err.message || 'Network error';
			}
			if (bookmarkId) {
				await updateBookmarkMetadataError(bookmarkId, reason);
			}
			await queue.pushRequest({ request: event.request });
			return err;
		}
	};

	event.respondWith(bgFetchMeta());
});
