import { getFavicon } from '$lib/utils/favicon';

// Type for data stored in the database (excludes computed properties)
export type BookmarkData = Omit<Bookmark, 'faviconUrl' | 'localUrl' | 'hasBody'>;

export class Bookmark {
	// automatically generated
	id: string; // UUID v4
	created: string;
	modified: string | null;
	keywords: string[]; // used for search

	// editable
	title: string; // used for search
	url: string;
	description: string;
	isReviewed: boolean;
	isStarred: boolean;
	tags: string[]; // used for search

	constructor(data: BookmarkData) {
		this.id = data.id;
		this.created = data.created;
		this.modified = data.modified;
		this.keywords = data.keywords;
		this.title = data.title;
		this.url = data.url;
		this.description = data.description;
		this.isReviewed = data.isReviewed;
		this.isStarred = data.isStarred;
		this.tags = data.tags;
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
