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

const METADATA_API_URL = 'https://metadata.breader.app/process';
const API_TIMEOUT_MS = 30000; // 30 seconds for JS-heavy pages like YouTube

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
		const metadata: UrlMetadata = {
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
