import { build, files, version } from '$service-worker';

// This gives `self` the correct types
const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
const RUNTIME_CACHE = `runtime-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

// Essential application routes to pre-cache for offline access
const ESSENTIAL_ROUTES = ['/', '/add-bookmark', '/account'];

// Cache size management
const MAX_RUNTIME_CACHE_ENTRIES = 50;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function manageCacheSize(cacheName: string, maxEntries: number = MAX_RUNTIME_CACHE_ENTRIES) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();

	if (keys.length > maxEntries) {
		// Remove oldest entries (FIFO)
		const keysToDelete = keys.slice(0, keys.length - maxEntries);
		await Promise.all(keysToDelete.map((key) => cache.delete(key)));
		console.log(`Cleaned up ${keysToDelete.length} old cache entries from ${cacheName}`);
	}
}

async function cleanExpiredCache(cacheName: string) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	const now = Date.now();

	for (const request of keys) {
		const response = await cache.match(request);
		if (response) {
			const dateHeader = response.headers.get('date');
			if (dateHeader) {
				const cacheDate = new Date(dateHeader).getTime();
				if (now - cacheDate > MAX_CACHE_AGE_MS) {
					await cache.delete(request);
					console.log(`Deleted expired cache entry: ${request.url}`);
				}
			}
		}
	}
}

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		const runtimeCache = await caches.open(RUNTIME_CACHE);

		// Cache static assets
		await cache.addAll(ASSETS);

		// Pre-cache essential routes with proper client-side route handling
		for (const route of ESSENTIAL_ROUTES) {
			try {
				// For client-side routes, request HTML with proper headers
				const request = new Request(route, {
					headers: {
						Accept: 'text/html',
						'Cache-Control': 'no-cache'
					}
				});
				const response = await fetch(request);
				if (response.ok) {
					await runtimeCache.put(route, response);
				}
			} catch (error) {
				console.warn(`Failed to pre-cache route ${route}, creating offline shell:`, error);
				// Create a minimal offline shell for failed routes
				const offlineShell = new Response(
					`<!DOCTYPE html>
					<html lang="en">
						<head>
							<meta charset="utf-8" />
							<meta name="viewport" content="width=device-width, initial-scale=1" />
							<title>Breader</title>
						</head>
						<body>
							<div id="app">Loading Breader...</div>
							<script>
								// Basic offline indicator
								if (!navigator.onLine) {
									document.getElementById('app').innerHTML =
										'<p>You are offline. Please check your connection and refresh.</p>';
								}
							</script>
						</body>
					</html>`,
					{
						headers: {
							'Content-Type': 'text/html; charset=utf-8',
							'Cache-Control': 'no-cache'
						}
					}
				);
				await runtimeCache.put(route, offlineShell);
			}
		}
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE && key !== RUNTIME_CACHE) {
				await caches.delete(key);
			}
		}
	}

	async function performCacheMaintenance() {
		await deleteOldCaches();

		// Manage cache sizes and clean expired entries
		await manageCacheSize(RUNTIME_CACHE);
		await cleanExpiredCache(CACHE);
		await cleanExpiredCache(RUNTIME_CACHE);
	}

	event.waitUntil(performCacheMaintenance());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);
		const runtimeCache = await caches.open(RUNTIME_CACHE);

		// Skip cross-origin requests
		if (url.origin !== location.origin) return fetch(event.request);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);
			if (response) {
				return response;
			}
		}

		// Handle API routes - always try network first
		if (url.pathname.startsWith('/api/')) {
			try {
				const response = await fetch(event.request);
				if (!(response instanceof Response)) {
					throw new Error('invalid response from fetch');
				}
				return response;
			} catch (err) {
				// API routes fail when offline - let the error propagate
				throw err;
			}
		}

		// Handle application routes with app shell pattern
		const isApplicationRoute =
			!url.pathname.startsWith('/api/') &&
			!url.pathname.includes('.') &&
			url.pathname !== '/favicon.ico';

		if (isApplicationRoute) {
			// Try runtime cache first for pre-cached routes
			let response = await runtimeCache.match(url.pathname);
			if (response) {
				return response;
			}

			// Try network for application routes
			try {
				response = await fetch(event.request);
				if (!(response instanceof Response)) {
					throw new Error('invalid response from fetch');
				}

				// Cache successful responses
				if (response.status === 200) {
					await runtimeCache.put(event.request, response.clone());
					// Manage cache size after adding new entries
					manageCacheSize(RUNTIME_CACHE).catch((err) =>
						console.warn('Cache size management failed:', err)
					);
				}

				return response;
			} catch (err) {
				// Network failed - try to serve the app shell (root page)
				// This allows SvelteKit client-side routing to handle the route
				const appShell = (await runtimeCache.match('/')) || (await cache.match('/'));
				if (appShell) {
					return appShell;
				}

				// No app shell available - error out
				throw err;
			}
		}

		// For everything else, try the network first, but fall back to cache
		try {
			const response = await fetch(event.request);

			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				await runtimeCache.put(event.request, response.clone());
				// Manage cache size after adding new entries
				manageCacheSize(RUNTIME_CACHE).catch((err) =>
					console.warn('Cache size management failed:', err)
				);
			}

			return response;
		} catch (err) {
			const response =
				(await cache.match(event.request)) || (await runtimeCache.match(event.request));

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});
