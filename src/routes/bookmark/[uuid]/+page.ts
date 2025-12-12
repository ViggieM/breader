import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { Bookmark } from '$lib/types';
import type { BookmarkData } from '$lib/types/bookmark';
import type { PageLoad } from './$types';

// this needs to be client side rendered, since we don't have any indexDB access on the server
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
		bookmark,
		uuid: params.uuid
	};
};
