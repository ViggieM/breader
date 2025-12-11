import { getFavicon } from '$lib/utils/favicon';

// Type for data stored in the database (excludes computed properties)
export type BookmarkData = Omit<Bookmark, 'faviconUrl' | 'localUrl' | 'hasBody'>;

// crawled information
export type BookmarkMetaData = {
	title: string; // original title
	description: string; // meta description
};

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
	meta?: BookmarkMetaData | null;

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
