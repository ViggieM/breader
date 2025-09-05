//ABOUTME: SvelteKit API route that provides CORS proxy for metadata extraction
//ABOUTME: Enables PWA to fetch content from external URLs without CORS restrictions

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UrlMetadata } from '$lib/utils/metadata';

function extractMetadata(html: string, url: string): UrlMetadata {
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	const ogTitleMatch = html.match(
		/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
	);
	const twitterTitleMatch = html.match(
		/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i
	);

	const descriptionMatch = html.match(
		/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
	);
	const ogDescriptionMatch = html.match(
		/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
	);
	const twitterDescriptionMatch = html.match(
		/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i
	);

	const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);

	const title = (titleMatch?.[1] || ogTitleMatch?.[1] || twitterTitleMatch?.[1] || '').trim();
	const description = (
		descriptionMatch?.[1] ||
		ogDescriptionMatch?.[1] ||
		twitterDescriptionMatch?.[1] ||
		''
	).trim();
	const keywordsString = keywordsMatch?.[1] || '';
	const keywords = keywordsString
		.split(',')
		.map((k) => k.trim())
		.filter((k) => k.length > 0);

	return {
		title: decodeHtmlEntities(title),
		description: decodeHtmlEntities(description),
		keywords,
		url
	};
}

function decodeHtmlEntities(text: string): string {
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&apos;': "'",
		'&#x27;': "'",
		'&#x2F;': '/',
		'&#x60;': '`',
		'&#x3D;': '='
	};

	return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

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

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');

	if (!targetUrl) {
		return error(400, 'URL parameter is required');
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(targetUrl);
	} catch {
		return error(400, 'Invalid URL format');
	}

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		return error(400, 'Only HTTP and HTTPS URLs are supported');
	}

	try {
		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent': 'Breader/1.0 (Bookmark Reader)'
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			return error(response.status, `Failed to fetch URL: ${response.statusText}`);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType?.includes('text/html')) {
			return error(400, 'URL must return HTML content');
		}

		const html = await response.text();
		const metadata = extractMetadata(html, targetUrl);

		return json(metadata, {
			headers: CORS_HEADERS
		});
	} catch (err) {
		console.error('Fetch error:', err);
		return error(500, 'Failed to fetch URL');
	}
};
