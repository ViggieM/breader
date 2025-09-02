import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { Bookmark } from '$lib/types';
import type { BookmarkData } from '$lib/types/bookmark';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	let data: BookmarkData | undefined;
	try {
		data = await db.bookmarks.get(params.uuid);
	} catch (err) {
		console.log(err);
	}

	if (!data) {
		error(404, 'Bookmark not found');
	}

	const bookmark = new Bookmark(data);

	return {
		bookmark
	};
};
