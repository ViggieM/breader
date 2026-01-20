// ABOUTME: SvelteKit API route that proxies content extraction requests to external API
// ABOUTME: Enables PWA to fetch clean article content from external URLs via metadata.breader.app

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidHttpUrl } from '$lib/utils/url-validation';

interface ContentApiResponse {
	content: string; // Sanitized HTML content
	title: string; // Article title
	textContent: string; // Plain text version
	length: number; // Content length
	excerpt: string; // Article excerpt
	byline: string; // Author info
	siteName: string; // Site name
}

const CONTENT_API_URL = 'https://metadata.breader.app/content';
const API_TIMEOUT_MS = 30000; // 30 seconds for JS-heavy pages

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

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json()) as { bookmarkId?: string; url?: string };
	const { bookmarkId, url: targetUrl } = body;

	if (!bookmarkId) {
		return error(400, 'Bookmark ID parameter is required');
	}

	if (!targetUrl) {
		return error(400, 'URL parameter is required');
	}

	// Validate URL before sending to external API
	if (!isValidHttpUrl(targetUrl)) {
		return error(400, 'Invalid or unsafe URL');
	}

	const apiKey = platform?.env?.METADATA_API_KEY;
	if (!apiKey) {
		console.error('METADATA_API_KEY is not configured');
		return error(500, 'Content extraction service is not configured');
	}

	try {
		const response = await fetch(CONTENT_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({ url: targetUrl, timeout: API_TIMEOUT_MS }),
			signal: AbortSignal.timeout(API_TIMEOUT_MS + 5000) // Add 5s buffer for network overhead
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			console.error(`Content API error (${response.status}): ${errorText}`);

			if (response.status >= 400 && response.status < 500) {
				return error(400, 'Unable to extract content from the requested URL');
			} else {
				return error(500, 'Content extraction service error occurred');
			}
		}

		const apiResponse = (await response.json()) as ContentApiResponse;

		if (!apiResponse.content) {
			return error(400, 'Unable to extract article content from this page');
		}

		return json(
			{
				bookmarkId,
				content: apiResponse.content, // Clean HTML with absolute URLs from external service
				title: apiResponse.title || null,
				excerpt: apiResponse.excerpt || null,
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
		if (err instanceof Error && err.name === 'TimeoutError') {
			return error(408, 'Request timed out while extracting content');
		}
		return error(500, 'Unable to extract content');
	}
};
