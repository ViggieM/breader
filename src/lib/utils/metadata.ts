//ABOUTME: Utility functions for fetching URL metadata from external websites
//ABOUTME: Provides clean interface for bookmark form to get title, description, and keywords

export interface UrlMetadata {
	title: string;
	description: string;
	keywords: string[];
	url: string;
}

export class MetadataFetchError extends Error {
	constructor(
		message: string,
		public readonly status?: number
	) {
		super(message);
		this.name = 'MetadataFetchError';
	}
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
	if (!url || typeof url !== 'string') {
		throw new MetadataFetchError('URL is required and must be a string');
	}

	let validatedUrl: URL;
	try {
		validatedUrl = new URL(url);
	} catch {
		throw new MetadataFetchError('Invalid URL format');
	}

	if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
		throw new MetadataFetchError('Only HTTP and HTTPS URLs are supported');
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

	try {
		const response = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(url)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			throw new MetadataFetchError(`Failed to fetch metadata: ${errorText}`, response.status);
		}

		const metadata: UrlMetadata = await response.json();
		return metadata;
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof MetadataFetchError) {
			throw error;
		}

		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				throw new MetadataFetchError('Request timeout - URL took too long to respond');
			}
			throw new MetadataFetchError(`Network error: ${error.message}`);
		}

		throw new MetadataFetchError('Unknown error occurred while fetching metadata');
	}
}
