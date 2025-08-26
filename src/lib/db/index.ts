import Dexie, { type EntityTable } from 'dexie';
import type { BookmarkData } from '$lib/types/bookmark.js';
import dexieCloud from 'dexie-cloud-addon';
import { PUBLIC_DEXIE_CLOUD_DB_URL } from '$env/static/public';

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
	databaseUrl: PUBLIC_DEXIE_CLOUD_DB_URL,
	requireAuth: true,
	fetchTokens: (tokenParams) =>
		fetch('/dexie-cloud-tokens', {
			method: 'post',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(tokenParams)
		}).then((res) => res.json())
});
