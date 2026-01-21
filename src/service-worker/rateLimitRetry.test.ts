// ABOUTME: Unit tests for rate limit retry logic
// ABOUTME: Tests parsing Retry-After headers and exponential backoff calculations

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	parseRetryAfter,
	calculateBackoffDelay,
	createRateLimitedResult,
	createFailureResult,
	createSuccessResult,
	MIN_RETRY_DELAY_MS,
	MAX_RETRY_DELAY_MS,
	DEFAULT_RATE_LIMIT_DELAY_MS
} from './rateLimitRetry';

describe('parseRetryAfter', () => {
	it('returns default delay for null input', () => {
		expect(parseRetryAfter(null)).toBe(DEFAULT_RATE_LIMIT_DELAY_MS);
	});

	it('parses seconds correctly', () => {
		expect(parseRetryAfter('30')).toBe(30000); // 30 seconds = 30000ms
		expect(parseRetryAfter('60')).toBe(60000);
		expect(parseRetryAfter('1')).toBe(1000);
	});

	it('caps delay at MAX_RETRY_DELAY_MS', () => {
		expect(parseRetryAfter('600')).toBe(MAX_RETRY_DELAY_MS); // 600s > 5min max
		expect(parseRetryAfter('9999')).toBe(MAX_RETRY_DELAY_MS);
	});

	it('parses HTTP date format', () => {
		const futureDate = new Date(Date.now() + 120000); // 2 minutes from now
		const httpDate = futureDate.toUTCString();
		const result = parseRetryAfter(httpDate);

		// Should be approximately 120000ms (with some tolerance for test execution time)
		expect(result).toBeGreaterThan(100000);
		expect(result).toBeLessThanOrEqual(MAX_RETRY_DELAY_MS);
	});

	it('returns default for invalid input', () => {
		expect(parseRetryAfter('not-a-number')).toBe(DEFAULT_RATE_LIMIT_DELAY_MS);
		expect(parseRetryAfter('')).toBe(DEFAULT_RATE_LIMIT_DELAY_MS);
	});
});

describe('calculateBackoffDelay', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5); // No jitter for predictable tests
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns base delay for first attempt', () => {
		const delay = calculateBackoffDelay(0);
		// With random = 0.5, jitter is 0, so delay = MIN_RETRY_DELAY_MS * 2^0 = 15000
		expect(delay).toBe(MIN_RETRY_DELAY_MS);
	});

	it('doubles delay for each attempt', () => {
		const delay0 = calculateBackoffDelay(0);
		const delay1 = calculateBackoffDelay(1);
		const delay2 = calculateBackoffDelay(2);

		expect(delay1).toBe(delay0 * 2);
		expect(delay2).toBe(delay0 * 4);
	});

	it('caps delay at MAX_RETRY_DELAY_MS', () => {
		const delay = calculateBackoffDelay(10); // 15000 * 2^10 = 15,360,000 > max
		expect(delay).toBe(MAX_RETRY_DELAY_MS);
	});

	it('adds jitter to delay', () => {
		vi.restoreAllMocks(); // Use real random

		const delays = new Set<number>();
		for (let i = 0; i < 10; i++) {
			delays.add(calculateBackoffDelay(1));
		}

		// With jitter, we should get different values
		expect(delays.size).toBeGreaterThan(1);
	});

	it('jitter stays within ±25% bounds', () => {
		vi.restoreAllMocks();

		for (let i = 0; i < 100; i++) {
			const delay = calculateBackoffDelay(1);
			const baseDelay = MIN_RETRY_DELAY_MS * 2; // 30000 for attempt 1
			const minExpected = baseDelay * 0.75;
			const maxExpected = baseDelay * 1.25;

			expect(delay).toBeGreaterThanOrEqual(minExpected);
			expect(delay).toBeLessThanOrEqual(maxExpected);
		}
	});
});

describe('result creators', () => {
	it('createSuccessResult returns success true', () => {
		expect(createSuccessResult()).toEqual({ success: true });
	});

	it('createFailureResult returns success false without rate limit', () => {
		expect(createFailureResult()).toEqual({ success: false, isRateLimited: false });
	});

	it('createRateLimitedResult extracts Retry-After header', () => {
		const headers = new Headers();
		headers.set('Retry-After', '45');

		const mockResponse = {
			headers,
			status: 429
		} as Response;

		const result = createRateLimitedResult(mockResponse);

		expect(result.success).toBe(false);
		expect(result.isRateLimited).toBe(true);
		expect(result.retryAfterMs).toBe(45000);
	});

	it('createRateLimitedResult uses default when no Retry-After header', () => {
		const mockResponse = {
			headers: new Headers(),
			status: 429
		} as Response;

		const result = createRateLimitedResult(mockResponse);

		expect(result.retryAfterMs).toBe(DEFAULT_RATE_LIMIT_DELAY_MS);
	});
});
