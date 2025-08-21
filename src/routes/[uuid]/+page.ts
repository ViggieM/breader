import { error } from '@sveltejs/kit';
import { bookmarkStore } from '$lib/stores/bookmarks.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const bookmark = bookmarkStore.getBookmark(params.uuid);

  if (!bookmark) {
    error(404, 'Bookmark not found');
  }

  return {
    bookmark,
  };
};
