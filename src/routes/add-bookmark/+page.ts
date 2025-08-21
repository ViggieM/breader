import type { Bookmark } from '$lib/types/bookmark';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const urlParams = url.searchParams;

  const articleData: Partial<Bookmark> = {
    title: urlParams.get('title') || '',
    url: urlParams.get('url') || urlParams.get('text') || '',
    description: urlParams.get('text') || '',
  };

  return {
    articleData,
  };
};
