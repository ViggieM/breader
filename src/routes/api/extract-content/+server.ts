// ABOUTME: SvelteKit API route for extracting article content from URLs using Readability
// ABOUTME: Acts as a CORS proxy and returns clean HTML suitable for offline reading

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidHttpUrl } from '$lib/utils/url-validation';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

const MAX_RESPONSE_SIZE = 20 * 1024 * 1024; // 20MB limit

/**
 * Convert relative URLs in HTML content to absolute URLs.
 * Handles src, href, and srcset attributes.
 *
 * @param html - The HTML content to process
 * @param baseUrl - The base URL to resolve relative URLs against
 * @returns HTML with absolute URLs
 */
function makeUrlsAbsolute(html: string, baseUrl: string): string {
	const url = new URL(baseUrl);
	const origin = url.origin;

	// Fix src attributes (images, scripts, iframes, etc.)
	html = html.replace(/(<[^>]+\s)src\s*=\s*["']([^"']+)["']/gi, (match, prefix, src: string) => {
		if (src.startsWith('//')) {
			// Protocol-relative URL
			return `${prefix}src="${url.protocol}${src}"`;
		} else if (src.startsWith('/')) {
			// Root-relative URL
			return `${prefix}src="${origin}${src}"`;
		} else if (
			!src.startsWith('http://') &&
			!src.startsWith('https://') &&
			!src.startsWith('data:')
		) {
			// Relative URL (not starting with protocol or data:)
			const basePath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
			return `${prefix}src="${origin}${basePath}${src}"`;
		}
		return match;
	});

	// Fix href attributes (links, stylesheets)
	html = html.replace(/(<[^>]+\s)href\s*=\s*["']([^"']+)["']/gi, (match, prefix, href: string) => {
		if (href.startsWith('//')) {
			return `${prefix}href="${url.protocol}${href}"`;
		} else if (href.startsWith('/')) {
			return `${prefix}href="${origin}${href}"`;
		} else if (
			!href.startsWith('http://') &&
			!href.startsWith('https://') &&
			!href.startsWith('#') &&
			!href.startsWith('mailto:') &&
			!href.startsWith('javascript:')
		) {
			const basePath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
			return `${prefix}href="${origin}${basePath}${href}"`;
		}
		return match;
	});

	// Fix srcset attributes (responsive images)
	html = html.replace(
		/(<[^>]+\s)srcset\s*=\s*["']([^"']+)["']/gi,
		(match, prefix, srcset: string) => {
			const fixedSrcset = srcset
				.split(',')
				.map((entry) => {
					const parts = entry.trim().split(/\s+/);
					if (parts.length === 0) return entry;

					let srcUrl = parts[0];
					const rest = parts.slice(1).join(' ');

					if (srcUrl.startsWith('//')) {
						srcUrl = `${url.protocol}${srcUrl}`;
					} else if (srcUrl.startsWith('/')) {
						srcUrl = `${origin}${srcUrl}`;
					} else if (
						!srcUrl.startsWith('http://') &&
						!srcUrl.startsWith('https://') &&
						!srcUrl.startsWith('data:')
					) {
						const basePath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
						srcUrl = `${origin}${basePath}${srcUrl}`;
					}

					return rest ? `${srcUrl} ${rest}` : srcUrl;
				})
				.join(', ');

			return `${prefix}srcset="${fixedSrcset}"`;
		}
	);

	return html;
}

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Max-Age': '86400'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: CORS_HEADERS
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { bookmarkId?: string; url?: string };
	const { bookmarkId, url: targetUrl } = body;

	if (!bookmarkId) {
		return error(400, 'Bookmark ID parameter is required');
	}

	if (!targetUrl) {
		return error(400, 'URL parameter is required');
	}

	// Validate URL and check for SSRF vulnerabilities
	if (!isValidHttpUrl(targetUrl)) {
		return error(400, 'Invalid or unsafe URL');
	}

	try {
		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent': 'Breader/1.0 (Bookmark Reader)',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			// Sanitize error messages to prevent information leakage
			if (response.status >= 400 && response.status < 500) {
				return error(400, 'Unable to access the requested URL');
			} else {
				return error(500, 'External server error occurred');
			}
		}

		const contentType = response.headers.get('content-type');
		if (!contentType?.includes('text/html') && !contentType?.includes('application/xhtml')) {
			return error(400, 'URL must return HTML content');
		}

		// Check response size to prevent DoS
		const contentLength = response.headers.get('content-length');
		if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
			return error(400, 'Response too large');
		}

		// Read response with size limit
		let html = '';
		const reader = response.body?.getReader();
		if (!reader) {
			return error(500, 'Unable to read response');
		}

		let totalSize = 0;
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				totalSize += value.length;
				if (totalSize > MAX_RESPONSE_SIZE) {
					reader.releaseLock();
					return error(400, 'Response too large');
				}

				html += new TextDecoder().decode(value);
			}
		} finally {
			reader.releaseLock();
		}

		// Parse HTML with linkedom (works on Cloudflare Workers)
		const { document } = parseHTML(html);

		// Use Readability to extract article content
		const reader2 = new Readability(document);
		const article = reader2.parse();

		if (!article || !article.content) {
			return error(400, 'Unable to extract article content from this page');
		}

		// Convert relative URLs to absolute URLs so images work offline
		const processedContent = makeUrlsAbsolute(article.content, targetUrl);

		return json(
			{
				bookmarkId,
				content: processedContent, // Clean HTML from Readability with absolute URLs
				title: article.title || null,
				excerpt: article.excerpt || null,
				originalUrl: targetUrl
			},
			{
				headers: {
					...CORS_HEADERS,
					'Content-Security-Policy': "default-src 'none'"
				}
			}
		);
	} catch (err) {
		console.error('Content extraction error:', err);
		// Don't expose internal error details
		if (err instanceof Error && err.name === 'TimeoutError') {
			return error(408, 'Request timed out while fetching the page');
		}
		return error(500, 'Unable to extract content');
	}
};
