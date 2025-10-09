// ABOUTME: Self-destructing service worker that unregisters itself and clears all caches
// ABOUTME: This service worker will remove itself and clean up on activation

// This gives `self` the correct types
const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
	// Skip waiting to activate immediately
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	async function selfDestruct() {
		// Delete all caches
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
		console.log('Service worker: All caches cleared');

		// Unregister this service worker
		await self.registration.unregister();
		console.log('Service worker: Unregistered successfully');
	}

	event.waitUntil(selfDestruct());
});

self.addEventListener('fetch', (event) => {
	// Pass through all requests without intercepting
	return;
});
