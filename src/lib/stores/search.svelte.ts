import Fuse, { type FuseIndex, type IFuseOptions } from 'fuse.js';
import { readable } from 'svelte/store';
import { getAllBookmarks, getArchivedBookmarks, getFavoriteBookmarks } from '$lib/db/bookmarks';
import type { BookmarkData } from '$lib/types';
import { trackSearchUsed } from '$lib/analytics/events';

// Debounce search tracking to track once per search session
let searchTracked = false;
let searchTimeout: ReturnType<typeof setTimeout>;

export class FuseSearchEngine {
	public data: BookmarkData[];
	private readonly fuse: Fuse<BookmarkData>;

	constructor(
		data: BookmarkData[],
		options?: IFuseOptions<BookmarkData>,
		index?: FuseIndex<BookmarkData>
	) {
		const defaultOptions: IFuseOptions<BookmarkData> = {
			threshold: 0.3,
			keys: [
				{ name: 'title', weight: 1.0 },
				{ name: 'keywords', weight: 0.7 },
				{
					name: 'tags',
					weight: 0.5
				}
			]
		};
		const searchOptions = { ...defaultOptions, ...options };
		this.data = data;
		this.fuse = new Fuse(data, searchOptions, index);
	}

	search(query: string): BookmarkData[] {
		if (!query.trim()) {
			return this.data;
		}

		// Track that search feature was used (once per session, debounced)
		if (query.length >= 2 && !searchTracked) {
			searchTracked = true;
			trackSearchUsed();

			// Reset after 30 seconds of no searching
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				searchTracked = false;
			}, 30000);
		}

		return this.fuse.search(query).map((result) => result.item);
	}
}

export const bookmarksData = readable<BookmarkData[]>([], (set) => {
	const observable = getAllBookmarks();
	const subscription = observable.subscribe((data: BookmarkData[]) => {
		if (data) set(data);
	});

	return () => subscription.unsubscribe();
});

export const archivedBookmarks = readable<BookmarkData[]>([], (set) => {
	const observable = getArchivedBookmarks();
	const subscription = observable.subscribe((data: BookmarkData[]) => {
		if (data) set(data);
	});

	return () => subscription.unsubscribe();
});

export const favoriteBookmarks = readable<BookmarkData[]>([], (set) => {
	const observable = getFavoriteBookmarks();
	const subscription = observable.subscribe((data: BookmarkData[]) => {
		if (data) set(data);
	});

	return () => subscription.unsubscribe();
});
