import Dexie, { type EntityTable, type Transaction } from 'dexie';
import type { BookmarkData, TagData, FaviconData } from '$lib/types';
import dexieCloud from 'dexie-cloud-addon';
import { PUBLIC_DEXIE_CLOUD_DB_URL } from '$env/static/public';
import type { NoteData } from '$lib/types/note';
import { BookmarkStatus } from '$lib/types/bookmark';

class Database extends Dexie {
	bookmarks!: EntityTable<BookmarkData, 'id'>;
	tags!: EntityTable<TagData, 'id'>;
	notes!: EntityTable<NoteData, 'id'>;
	favicons!: EntityTable<FaviconData, 'id'>;

	constructor() {
		super('BookmarkManager', { addons: [dexieCloud] });
	}
}

export const db = new Database();

db.cloud.configure({
	databaseUrl: PUBLIC_DEXIE_CLOUD_DB_URL,
	requireAuth: false,
	fetchTokens: (tokenParams) =>
		fetch('/dexie-cloud-tokens', {
			method: 'post',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(tokenParams)
		}).then((res) => res.json())
});

db.version(5).stores({
	bookmarks: '@id, title, url, *tags, *keywords, isStarred, isReviewed, created, modified',
	tags: '@id, parentId, name, order',
	lists: '@id'
});

db.version(6)
	.stores({
		bookmarks: '@id, title, url, *tags, *keywords, isStarred, created, modified, status',
		tags: '@id, parentId, name, order'
	})
	.upgrade((trans) => {
		return trans
			.table('bookmarks')
			.toCollection()
			.modify((bookmark) => {
				if (bookmark.isArchived) {
					bookmark.status = BookmarkStatus.ARCHIVED;
				} else if (bookmark.isReviewed) {
					bookmark.status = BookmarkStatus.READ;
				} else if (bookmark.isReading) {
					bookmark.status = BookmarkStatus.READING;
				} else {
					bookmark.status = BookmarkStatus.WANT_TO_READ;
				}

				delete bookmark.isArchived;
				delete bookmark.isReviewed;
				delete bookmark.isReading;
			});
	});

db.version(7).stores({
	bookmarks: '@id, title, url, *tags, *keywords, isStarred, created, modified, status',
	tags: '@id, parentId, name, order',
	lists: null, // Remove lists table
	notes: '@id, *bookmarks, created, modified' // Add notes table
});

db.version(8).stores({
	bookmarks: '@id, title, url, *tags, *keywords, isStarred, created, modified, status',
	tags: '@id, parentId, name, order',
	notes: '@id, *bookmarks, created, modified, title' // Add title field to notes
});

db.version(9).stores({
	bookmarks: '@id, title, url, *tags, *keywords, isStarred, created, modified, status',
	tags: '@id, parentId, name, order',
	notes: '@id, *bookmarks, created, modified, title',
	favicons: '@id, &domain' // Domain-level favicon caching
});

db.on('populate', (tx: Transaction) => {
	const now = new Date();
	tx.table('bookmarks').add({
		id: 'bkm-what-is-breader',
		title: 'What is Breader?',
		url: 'https://breader.app/help/what-is-breader',
		tags: [],
		created: new Date(now).toISOString(),
		status: 3, // WANT_TO_READ
		isStarred: true
	});
	tx.table('bookmarks').add({
		id: 'bkm-how-to-use',
		title: 'How to use Breader',
		url: 'https://breader.app/help/how-to-use',
		tags: [],
		created: new Date(Number(now) - 1).toISOString(),
		status: 3, // WANT_TO_READ
		isStarred: false
	});
	tx.table('bookmarks').add({
		id: 'bkm-import-bookmarks',
		title: 'How to Import Bookmarks',
		url: 'https://breader.app/help/import-bookmarks',
		tags: [],
		created: new Date(Number(now) - 2).toISOString(),
		status: 3, // WANT_TO_READ
		isStarred: false
	});
});
db.open();
