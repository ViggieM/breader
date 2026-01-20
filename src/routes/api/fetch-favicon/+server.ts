// ABOUTME: SvelteKit API route that fetches a favicon and converts it to base64 data URI
// ABOUTME: Used for caching favicons in IndexedDB for offline display

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Maximum favicon size in bytes (5KB) */
const MAX_FAVICON_SIZE = 5 * 1024;

/** Timeout for favicon fetch in milliseconds */
const FETCH_TIMEOUT_MS = 10000;

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

	// Default to x-icon for .ico files or favicon URLs
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

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { url?: string };
	const { url: faviconUrl } = body;

	if (!faviconUrl) {
		return json(
			{ error: 'URL parameter is required', reason: 'fetch_error' },
			{ status: 400, headers: CORS_HEADERS }
		);
	}

	// Validate URL format
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(faviconUrl);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new Error('Invalid protocol');
		}
	} catch {
		return json(
			{ error: 'Invalid URL', reason: 'fetch_error' },
			{ status: 400, headers: CORS_HEADERS }
		);
	}

	try {
		const response = await fetch(faviconUrl, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			headers: {
				Accept: 'image/*',
				'User-Agent': 'Breader/1.0 (favicon fetcher)'
			}
		});

		if (!response.ok) {
			return json(
				{ error: `Failed to fetch favicon: ${response.status}`, reason: 'fetch_error' },
				{ status: 200, headers: CORS_HEADERS }
			);
		}

		// Check Content-Length header first (if available)
		const contentLength = response.headers.get('Content-Length');
		if (contentLength && parseInt(contentLength, 10) > MAX_FAVICON_SIZE) {
			return json(
				{
					error: `Favicon too large: ${contentLength} bytes (max ${MAX_FAVICON_SIZE})`,
					reason: 'too_large'
				},
				{ status: 200, headers: CORS_HEADERS }
			);
		}

		// Get the response as ArrayBuffer
		const buffer = await response.arrayBuffer();

		// Check actual size
		if (buffer.byteLength > MAX_FAVICON_SIZE) {
			return json(
				{
					error: `Favicon too large: ${buffer.byteLength} bytes (max ${MAX_FAVICON_SIZE})`,
					reason: 'too_large'
				},
				{ status: 200, headers: CORS_HEADERS }
			);
		}

		// Determine MIME type
		const contentType = response.headers.get('Content-Type');
		const mimeType = getMimeType(contentType, faviconUrl);

		if (!mimeType) {
			return json(
				{ error: 'Invalid image type', reason: 'invalid_image' },
				{ status: 200, headers: CORS_HEADERS }
			);
		}

		// Convert to base64 data URI
		const base64 = arrayBufferToBase64(buffer);
		const dataUri = `data:${mimeType};base64,${base64}`;

		return json({ data: dataUri }, { status: 200, headers: CORS_HEADERS });
	} catch (err) {
		if (err instanceof Error && err.name === 'TimeoutError') {
			return json(
				{ error: 'Favicon fetch timeout', reason: 'fetch_error' },
				{ status: 200, headers: CORS_HEADERS }
			);
		}

		console.error('Favicon fetch error:', err);
		return json(
			{ error: 'Failed to fetch favicon', reason: 'fetch_error' },
			{ status: 200, headers: CORS_HEADERS }
		);
	}
};
