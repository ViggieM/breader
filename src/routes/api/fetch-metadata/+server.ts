//ABOUTME: SvelteKit API route that proxies metadata extraction requests to external API
//ABOUTME: Enables PWA to fetch metadata from external URLs via metadata.breader.app

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UrlMetadata } from '$lib/utils/metadata';
import { isValidHttpUrl } from '$lib/utils/url-validation';

interface MetadataApiResponse {
	title: string;
	description: string;
	keywords: string[];
	image: string | null;
	favicon: string | null;
	author: string | null;
	publisher: string | null;
	datePublished: string | null;
	dateModified: string | null;
	url: string;
	statusCode: number;
}

/** Extended metadata response with favicon base64 data */
interface ExtendedUrlMetadata extends UrlMetadata {
	faviconBase64?: string | null;
	faviconError?: string | null;
}

const METADATA_API_URL = 'https://metadata.breader.app/process';
const API_TIMEOUT_MS = 30000; // 30 seconds for JS-heavy pages like YouTube
const FAVICON_TIMEOUT_MS = 5000; // 5 seconds for favicon fetch
const MAX_FAVICON_SIZE = 5 * 1024; // 5KB

/** Valid image MIME types for favicons */
const VALID_IMAGE_TYPES = [
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'image/x-icon',
	'image/vnd.microsoft.icon'
];

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Max-Age': '86400'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: CORS_HEADERS
	});
};

/**
 * Get Google S2 favicon URL as fallback.
 */
function getGoogleFaviconUrl(targetUrl: string): string {
	try {
		const domain = new URL(targetUrl).hostname;
		return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
	} catch {
		return '';
	}
}

/**
 * Determine MIME type from Content-Type header or URL extension.
 */
function getMimeType(contentType: string | null, url: string): string | null {
	// Try Content-Type header first
	if (contentType) {
		const mimeType = contentType.split(';')[0].trim().toLowerCase();
		if (VALID_IMAGE_TYPES.includes(mimeType)) {
			return mimeType;
		}
	}

	// Fallback to URL extension
	const extension = url.split('.').pop()?.toLowerCase();
	const extensionMimeMap: Record<string, string> = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		webp: 'image/webp',
		svg: 'image/svg+xml',
		ico: 'image/x-icon'
	};

	if (extension && extensionMimeMap[extension]) {
		return extensionMimeMap[extension];
	}

	// Default to x-icon for favicon URLs
	if (url.includes('favicon')) {
		return 'image/x-icon';
	}

	return null;
}

/**
 * Convert ArrayBuffer to base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Fetch a favicon URL and convert to base64 data URI.
 * Returns { data } on success or { error } on failure.
 */
async function fetchFaviconAsBase64(
	faviconUrl: string
): Promise<{ data?: string; error?: string }> {
	try {
		const response = await fetch(faviconUrl, {
			signal: AbortSignal.timeout(FAVICON_TIMEOUT_MS),
			headers: {
				Accept: 'image/*',
				'User-Agent': 'Breader/1.0 (favicon fetcher)'
			}
		});

		if (!response.ok) {
			return { error: 'fetch_error' };
		}

		// Check Content-Length header first (if available)
		const contentLength = response.headers.get('Content-Length');
		if (contentLength && parseInt(contentLength, 10) > MAX_FAVICON_SIZE) {
			return { error: 'too_large' };
		}

		// Get the response as ArrayBuffer
		const buffer = await response.arrayBuffer();

		// Check actual size
		if (buffer.byteLength > MAX_FAVICON_SIZE) {
			return { error: 'too_large' };
		}

		// Determine MIME type
		const contentType = response.headers.get('Content-Type');
		const mimeType = getMimeType(contentType, faviconUrl);

		if (!mimeType) {
			return { error: 'invalid_image' };
		}

		// Convert to base64 data URI
		const base64 = arrayBufferToBase64(buffer);
		return { data: `data:${mimeType};base64,${base64}` };
	} catch (err) {
		if (err instanceof Error && err.name === 'TimeoutError') {
			return { error: 'fetch_error' };
		}
		return { error: 'fetch_error' };
	}
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json()) as { id?: string; url?: string };
	const { id: bookmarkId, url: targetUrl } = body;

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
		return error(500, 'Metadata service is not configured');
	}

	try {
		const response = await fetch(METADATA_API_URL, {
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
			console.error(`Metadata API error (${response.status}): ${errorText}`);

			if (response.status >= 400 && response.status < 500) {
				return error(400, 'Unable to fetch metadata for the requested URL');
			} else {
				return error(500, 'Metadata service error occurred');
			}
		}

		const apiResponse = (await response.json()) as MetadataApiResponse;

		// Map API response to UrlMetadata interface (excluding statusCode)
		const metadata: ExtendedUrlMetadata = {
			title: apiResponse.title || '',
			description: apiResponse.description || '',
			keywords: apiResponse.keywords || [],
			url: apiResponse.url || targetUrl,
			image: apiResponse.image,
			favicon: apiResponse.favicon,
			author: apiResponse.author,
			publisher: apiResponse.publisher,
			datePublished: apiResponse.datePublished,
			dateModified: apiResponse.dateModified
		};

		// Fetch favicon as base64 (don't block if it fails)
		const faviconUrl = apiResponse.favicon || getGoogleFaviconUrl(targetUrl);
		if (faviconUrl) {
			const faviconResult = await fetchFaviconAsBase64(faviconUrl);
			if (faviconResult.data) {
				metadata.faviconBase64 = faviconResult.data;
			} else if (faviconResult.error) {
				metadata.faviconError = faviconResult.error;
			}
		}

		return json(
			{ bookmarkId, ...metadata },
			{
				headers: {
					...CORS_HEADERS,
					'Content-Security-Policy': "default-src 'none'"
				}
			}
		);
	} catch (err) {
		console.error('Metadata fetch error:', err);
		if (err instanceof Error && err.name === 'TimeoutError') {
			return error(500, 'Metadata service timeout');
		}
		return error(500, 'Unable to fetch metadata');
	}
};
