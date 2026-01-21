// ABOUTME: PostHog analytics client initialization and utilities
// ABOUTME: Privacy-focused - tracks feature usage only, no personal data

import posthog from 'posthog-js';
import { browser } from '$app/environment';

// Use dynamic import to handle optional env vars gracefully
let apiKey: string | undefined;
let apiHost: string | undefined;

try {
	// These may not exist if user hasn't configured PostHog
	const env = import.meta.env;
	apiKey = env.PUBLIC_POSTHOG_API_KEY;
	apiHost = env.PUBLIC_POSTHOG_HOST;
} catch {
	// Env vars not available, PostHog will be disabled
}

export function initPostHog() {
	if (browser && apiKey) {
		posthog.init(apiKey, {
			api_host: apiHost || 'https://eu.i.posthog.com',
			capture_pageview: true,
			capture_performance: true,
			persistence: 'localStorage',
			autocapture: false, // Disable to avoid capturing form data
			mask_all_text: true,
			mask_all_element_attributes: true
		});
	}
}

export function identifyUser(userId: string) {
	if (browser) posthog.identify(userId);
}

export function resetUser() {
	if (browser) posthog.reset();
}

export { posthog };
