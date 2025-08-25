import Dexie, { type EntityTable } from 'dexie';
import type { BookmarkData } from '$lib/types/bookmark.js';
import dexieCloud from 'dexie-cloud-addon';

class Database extends Dexie {
	bookmarks!: EntityTable<BookmarkData, 'id'>;

	constructor() {
		super('BookmarkManager', { addons: [dexieCloud] });
		this.version(1).stores({
			bookmarks: '@id, title, url, *tags, *keywords, isStarred, isReviewed, created, modified'
		});
	}
}

export const db = new Database();

db.cloud.configure({
	databaseUrl: 'https://z6n1slc6l.dexie.cloud',
	requireAuth: true // optional
});
