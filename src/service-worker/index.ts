// ABOUTME: Self-destructing service worker that unregisters itself and clears all caches
// ABOUTME: This service worker will remove itself and clean up on activation
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { Queue } from 'workbox-background-sync';
import { updateBookmarkMetadata } from '../lib/db/bookmarks';

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
		try {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), 10000); // 10 second timeout
			const response = await fetch(event.request.clone(), { signal: controller.signal });
			const meta = await response.clone().json();
			const { bookmarkId, ...data } = meta;
			await updateBookmarkMetadata(bookmarkId, data, data.title);
			return response;
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('FetchMetadata Request Aborted');
				// todo: think about how to handle repeated timeouts and unnecessary Queue pollution
			}
			await queue.pushRequest({ request: event.request });
			return error;
		}
	};

	event.respondWith(bgFetchMeta());
});
