//ABOUTME: Network state management store for tracking online/offline status
//ABOUTME: Provides reactive network state for PWA offline functionality

let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
let cleanup: (() => void) | null = null;

// Update online status when network state changes
if (typeof window !== 'undefined') {
	const updateOnlineStatus = () => {
		isOnline = navigator.onLine;
	};

	window.addEventListener('online', updateOnlineStatus);
	window.addEventListener('offline', updateOnlineStatus);

	cleanup = () => {
		window.removeEventListener('online', updateOnlineStatus);
		window.removeEventListener('offline', updateOnlineStatus);
	};
}

export const networkState = {
	get isOnline() {
		return isOnline;
	},
	get isOffline() {
		return !isOnline;
	},
	// todo: not sure if this method is even called. Check Svelte 5 docs to validate
	cleanup() {
		if (cleanup) {
			cleanup();
			cleanup = null;
		}
	}
};

export type NetworkState = typeof networkState;
