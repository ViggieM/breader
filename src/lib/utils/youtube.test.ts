// ABOUTME: Unit tests for YouTube URL parsing and video ID extraction
// ABOUTME: Tests various YouTube URL formats and edge cases

import { describe, it, expect } from 'vitest';
import { parseYouTubeUrl, getYouTubeEmbedUrl, isYouTubeVideo } from './youtube';

describe('parseYouTubeUrl', () => {
	it('should parse standard watch URLs', () => {
		const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'watch' });
	});

	it('should parse standard watch URLs without www', () => {
		const result = parseYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'watch' });
	});

	it('should parse standard watch URLs with http', () => {
		const result = parseYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'watch' });
	});

	it('should parse short URLs (youtu.be)', () => {
		const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'short' });
	});

	it('should parse short URLs with query parameters', () => {
		const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=42');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'short' });
	});

	it('should parse shorts URLs', () => {
		const result = parseYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'shorts' });
	});

	it('should parse shorts URLs with www', () => {
		const result = parseYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'shorts' });
	});

	it('should parse embed URLs', () => {
		const result = parseYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
		expect(result).toEqual({ videoId: 'dQw4w9WgXcQ', urlType: 'embed' });
	});

	it('should return null for non-YouTube URLs', () => {
		expect(parseYouTubeUrl('https://example.com')).toBeNull();
		expect(parseYouTubeUrl('https://vimeo.com/123456')).toBeNull();
		expect(parseYouTubeUrl('https://google.com')).toBeNull();
	});

	it('should return null for YouTube URLs without video ID', () => {
		expect(parseYouTubeUrl('https://www.youtube.com')).toBeNull();
		expect(parseYouTubeUrl('https://www.youtube.com/watch')).toBeNull();
	});

	it('should return null for invalid video IDs (too short)', () => {
		expect(parseYouTubeUrl('https://www.youtube.com/watch?v=short')).toBeNull();
		expect(parseYouTubeUrl('https://youtu.be/short')).toBeNull();
	});

	it('should return null for invalid video IDs (too long)', () => {
		expect(parseYouTubeUrl('https://www.youtube.com/watch?v=wayToolongId')).toBeNull();
	});

	it('should return null for invalid video IDs (invalid characters)', () => {
		expect(parseYouTubeUrl('https://www.youtube.com/watch?v=invalid@id!')).toBeNull();
	});

	it('should return null for malformed URLs', () => {
		expect(parseYouTubeUrl('not a url')).toBeNull();
		expect(parseYouTubeUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull(); // missing protocol
	});

	it('should handle video IDs with hyphens and underscores', () => {
		const result = parseYouTubeUrl('https://www.youtube.com/watch?v=abc-123_XYZ');
		expect(result).toEqual({ videoId: 'abc-123_XYZ', urlType: 'watch' });
	});

	it('should handle video IDs with only numbers', () => {
		const result = parseYouTubeUrl('https://www.youtube.com/watch?v=12345678901');
		expect(result).toEqual({ videoId: '12345678901', urlType: 'watch' });
	});
});

describe('getYouTubeEmbedUrl', () => {
	it('should generate correct embed URL', () => {
		const embedUrl = getYouTubeEmbedUrl('dQw4w9WgXcQ');
		expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
	});

	it('should use standard youtube.com domain', () => {
		const embedUrl = getYouTubeEmbedUrl('test12345ab');
		expect(embedUrl).toBe('https://www.youtube.com/embed/test12345ab');
	});
});

describe('isYouTubeVideo', () => {
	it('should return true for valid YouTube URLs', () => {
		expect(isYouTubeVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
		expect(isYouTubeVideo('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
		expect(isYouTubeVideo('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
	});

	it('should return false for non-YouTube URLs', () => {
		expect(isYouTubeVideo('https://example.com')).toBe(false);
		expect(isYouTubeVideo('https://vimeo.com/123456')).toBe(false);
	});

	it('should return false for invalid YouTube URLs', () => {
		expect(isYouTubeVideo('https://www.youtube.com')).toBe(false);
		expect(isYouTubeVideo('https://www.youtube.com/watch?v=invalid')).toBe(false);
	});
});
