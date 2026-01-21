// ABOUTME: Rate-limit-aware retry logic for service worker background sync
// ABOUTME: Handles 429 responses, Retry-After headers, and exponential backoff

// Rate limiting constants
const MIN_RETRY_DELAY_MS = 15000; // 15 seconds minimum between retries
const MAX_RETRY_DELAY_MS = 300000; // 5 minutes maximum delay
const DEFAULT_RATE_LIMIT_DELAY_MS = 60000; // 1 minute default for 429 without Retry-After

export interface ProcessResult {
	success: boolean;
	retryAfterMs?: number;
	isRateLimited?: boolean;
}

/**
 * Parse Retry-After header value.
 * Can be either a number of seconds or an HTTP date.
 * Returns delay in milliseconds.
 */
export function parseRetryAfter(retryAfter: string | null): number {
	if (!retryAfter) {
		return DEFAULT_RATE_LIMIT_DELAY_MS;
	}

	// Try parsing as seconds first
	const seconds = parseInt(retryAfter, 10);
	if (!isNaN(seconds)) {
		return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
	}

	// Try parsing as HTTP date
	const date = new Date(retryAfter);
	if (!isNaN(date.getTime())) {
		const delayMs = date.getTime() - Date.now();
		return Math.max(MIN_RETRY_DELAY_MS, Math.min(delayMs, MAX_RETRY_DELAY_MS));
	}

	return DEFAULT_RATE_LIMIT_DELAY_MS;
}

/**
 * Calculate exponential backoff delay with jitter.
 * @param attempt - The retry attempt number (0-based)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number): number {
	// Base delay: 15s, 30s, 60s, 120s, 240s (capped at MAX_RETRY_DELAY_MS)
	const baseDelay = MIN_RETRY_DELAY_MS * Math.pow(2, attempt);
	const cappedDelay = Math.min(baseDelay, MAX_RETRY_DELAY_MS);

	// Add jitter (±25%) to prevent thundering herd
	const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
	return Math.round(cappedDelay + jitter);
}

/**
 * Create a rate-limited result for 429 responses.
 */
export function createRateLimitedResult(response: Response): ProcessResult {
	const retryAfter = response.headers.get('Retry-After');
	const retryAfterMs = parseRetryAfter(retryAfter);
	console.log(`[SW] Rate limited (429). Retry after ${retryAfterMs}ms`);
	return { success: false, retryAfterMs, isRateLimited: true };
}

/**
 * Create a failure result for non-rate-limit errors.
 */
export function createFailureResult(): ProcessResult {
	return { success: false, isRateLimited: false };
}

/**
 * Create a success result.
 */
export function createSuccessResult(): ProcessResult {
	return { success: true };
}

/**
 * Delay helper that returns a promise.
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export { MIN_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS, DEFAULT_RATE_LIMIT_DELAY_MS };
