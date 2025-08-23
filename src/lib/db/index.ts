import Dexie, { type EntityTable } from 'dexie';
import type { BookmarkData } from '$lib/types/bookmark.js';
import './dexie-uuid-plugin.js';

class Database extends Dexie {
	bookmarks!: EntityTable<BookmarkData, 'id'>;

	constructor() {
		super('BookmarkManager');
		this.version(1).stores({
			bookmarks: '$$id, title, url, *tags, *keywords, isStarred, isReviewed, created, modified'
		});
	}
}

export const db = new Database();
