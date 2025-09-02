import Dexie, { type EntityTable } from 'dexie';
import type { BookmarkData, TagData } from '$lib/types';
import dexieCloud from 'dexie-cloud-addon';
import { PUBLIC_DEXIE_CLOUD_DB_URL } from '$env/static/public';

class Database extends Dexie {
	bookmarks!: EntityTable<BookmarkData, 'id'>;
	tags!: EntityTable<TagData, 'id'>;

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

db.version(2).stores({
	bookmarks: '@id, title, url, *tags, *keywords, isStarred, isReviewed, created, modified',
	tags: '@id, parentId, name, order'
});
