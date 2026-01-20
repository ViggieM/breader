// ABOUTME: Unit tests for favicon database utility functions
// ABOUTME: Tests domain extraction and retry logic (does not test IndexedDB operations)

import { describe, it, expect } from 'vitest';
import { shouldRetryFavicon, extractDomain } from './favicons';
import type { FaviconData } from '$lib/types';

describe('extractDomain', () => {
	it('should extract domain from standard URLs', () => {
		expect(extractDomain('https://www.example.com/page')).toBe('www.example.com');
		expect(extractDomain('https://example.com/page')).toBe('example.com');
		expect(extractDomain('http://example.com')).toBe('example.com');
	});

	it('should extract domain from URLs with ports', () => {
		expect(extractDomain('https://localhost:3000/page')).toBe('localhost');
		expect(extractDomain('https://example.com:8080/page')).toBe('example.com');
	});

	it('should extract domain from URLs with subdomains', () => {
		expect(extractDomain('https://subdomain.example.com/page')).toBe('subdomain.example.com');
		expect(extractDomain('https://a.b.c.example.com')).toBe('a.b.c.example.com');
	});

	it('should return empty string for invalid URLs', () => {
		expect(extractDomain('not-a-url')).toBe('');
		expect(extractDomain('')).toBe('');
		expect(extractDomain('ftp://example.com')).toBe('example.com'); // URL constructor handles this
	});
});

describe('shouldRetryFavicon', () => {
	const createFavicon = (failed: boolean, modifiedAt: string): FaviconData => ({
		id: 'test-id',
		domain: 'example.com',
		data: null,
		failed,
		failedReason: failed ? 'fetch_error' : null,
		createdAt: '2024-01-01T00:00:00.000Z',
		modifiedAt
	});

	it('should return false for successful favicons', () => {
		const favicon = createFavicon(false, new Date().toISOString());
		expect(shouldRetryFavicon(favicon)).toBe(false);
	});

	it('should return false for recently failed favicons', () => {
		// Failed 1 day ago
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const favicon = createFavicon(true, oneDayAgo);
		expect(shouldRetryFavicon(favicon)).toBe(false);
	});

	it('should return false for favicons failed less than 7 days ago', () => {
		// Failed 6 days ago
		const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
		const favicon = createFavicon(true, sixDaysAgo);
		expect(shouldRetryFavicon(favicon)).toBe(false);
	});

	it('should return true for favicons failed more than 7 days ago', () => {
		// Failed 8 days ago
		const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
		const favicon = createFavicon(true, eightDaysAgo);
		expect(shouldRetryFavicon(favicon)).toBe(true);
	});

	it('should return true for favicons failed exactly 7 days ago plus 1ms', () => {
		// Failed 7 days + 1ms ago
		const sevenDaysPlus = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
		const favicon = createFavicon(true, sevenDaysPlus);
		expect(shouldRetryFavicon(favicon)).toBe(true);
	});
});
