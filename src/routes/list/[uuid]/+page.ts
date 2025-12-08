import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { List, type ListData } from '$lib/types';
import type { PageLoad } from './$types';

// this needs to be client side rendered, since we don't have any indexDB access on the server
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	let data: ListData | undefined;
	try {
		data = await db.lists.get(params.uuid);
	} catch (err) {
		console.log(err);
	}

	if (!data) {
		error(404, 'Bookmark not found');
	}

	const list = new List(data);

	return {
		list,
		uuid: params.uuid
	};
};
