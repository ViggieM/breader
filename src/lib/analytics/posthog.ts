// ABOUTME: PostHog analytics client initialization and utilities
// ABOUTME: Privacy-focused - tracks feature usage only, no personal data

import posthog from 'posthog-js';
import { browser } from '$app/environment';

// Use dynamic import to handle optional env vars gracefully
import { PUBLIC_POSTHOG_API_KEY, PUBLIC_POSTHOG_HOST } from '$env/static/public';

export function initPostHog() {
	if (browser && PUBLIC_POSTHOG_API_KEY) {
		posthog.init(PUBLIC_POSTHOG_API_KEY, {
			api_host: PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
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
