import { getFavicon } from '$lib/utils/favicon';

// Type for data stored in the database (excludes computed properties)
export type BookmarkData = Omit<Bookmark, 'faviconUrl' | 'localUrl' | 'hasBody'>;

// crawled information from external metadata API
export type BookmarkMetaData = {
	title: string; // original title
	description: string; // meta description
	// Optional fields from metadata API
	keywords?: string[];
	image?: string | null;
	favicon?: string | null;
	author?: string | null;
	publisher?: string | null;
	datePublished?: string | null;
	dateModified?: string | null;
};

// Metadata fetch status types (discriminated union)
export type MetadataPending = { pending: true };
export type MetadataError = { error: true; reason: string };
export type BookmarkMeta = BookmarkMetaData | MetadataError | MetadataPending | null;

// Type guards for metadata status
export function isMetadataPending(meta: BookmarkMeta | undefined): meta is MetadataPending {
	return meta !== null && meta !== undefined && typeof meta === 'object' && 'pending' in meta;
}

export function isMetadataError(meta: BookmarkMeta | undefined): meta is MetadataError {
	return meta !== null && meta !== undefined && typeof meta === 'object' && 'error' in meta;
}

export function isMetadataSuccess(meta: BookmarkMeta | undefined): meta is BookmarkMetaData {
	return meta !== null && meta !== undefined && typeof meta === 'object' && 'title' in meta;
}

export const BookmarkStatus = {
	ARCHIVED: 0,
	READING: 1,
	READ: 2,
	WANT_TO_READ: 3
} as const;

export type BookmarkStatus = (typeof BookmarkStatus)[keyof typeof BookmarkStatus];

export class Bookmark {
	// automatically generated
	id: string; // UUID v4
	created: string;
	modified: string | null;
	keywords: string[]; // used for search
	meta?: BookmarkMeta;

	// editable
	title?: string | null; // used for search, can be null while metadata was not fetched
	url: string;
	description?: string;
	status: BookmarkStatus;
	isStarred?: boolean;
	tags: string[]; // used for search

	constructor(data: BookmarkData) {
		this.id = data.id;
		this.created = data.created;
		this.modified = data.modified;
		this.keywords = data.keywords;
		this.title = data.title;
		this.url = data.url;
		this.description = data.description;
		this.status = data.status ?? BookmarkStatus.WANT_TO_READ;
		this.isStarred = data.isStarred || false;
		this.tags = data.tags;
		this.meta = data.meta;
	}

	get faviconUrl(): string {
		return getFavicon(this.url);
	}

	get localUrl(): string {
		return `/${this.id}`;
	}

	get hasBody(): boolean {
		// todo: this should be determined, whether or not there are notes or article was saved for offline reading
		return true;
	}
}
